import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { useAppSession } from "../sessions/appSession";
import {
	CreateRoomSchema,
	DeleteRoomSchema,
	GetRoomSchema,
	GetRoomsSchema,
	UpdateRoomSchema,
} from "./schema";

export const getRoomsFn = createServerFn({ method: "GET" })
	.inputValidator(GetRoomsSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		// Verify property ownership
		const property = await prisma.property.findUnique({
			where: { id: data.propertyId },
		});

		if (!property) throw new Error("Property not found");
		if (property.ownerId !== session.data.id) {
			throw new Error("Forbidden: You do not own this property");
		}

		const rooms = await prisma.room.findMany({
			where: {
				propertyId: data.propertyId,
				...(data.status && { status: data.status }),
			},
			orderBy: { createdAt: "desc" },
			include: {
				_count: {
					select: { tenants: { where: { status: "active" } } },
				},
			},
		});

		return rooms;
	});

export const getRoomFn = createServerFn({ method: "GET" })
	.inputValidator(GetRoomSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const room = await prisma.room.findUnique({
			where: { id: data.id },
			include: {
				property: true,
			},
		});

		if (!room) throw new Error("Room not found");
		if (room.property.ownerId !== session.data.id) {
			throw new Error("Forbidden: You do not own this room");
		}

		return room;
	});

export const createRoomFn = createServerFn({ method: "POST" })
	.inputValidator(CreateRoomSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		// Verify property ownership and get owner plan
		const property = await prisma.property.findUnique({
			where: { id: data.propertyId },
			include: { owner: true },
		});

		if (!property) throw new Error("Property not found");
		if (property.ownerId !== session.data.id) {
			throw new Error("Forbidden: You do not own this property");
		}

		// Enforce freemium limit
		if (property.owner.plan === "free") {
			const roomCount = await prisma.room.count({
				where: { propertyId: data.propertyId },
			});

			if (roomCount >= 10) {
				throw new Error("FREE_PLAN_LIMIT_REACHED");
			}
		}

		// Check if room number already exists in this property
		const existingRoom = await prisma.room.findUnique({
			where: {
				propertyId_roomNumber: {
					propertyId: data.propertyId,
					roomNumber: data.roomNumber,
				},
			},
		});

		if (existingRoom) {
			throw new Error(
				"A room with this number already exists in this property",
			);
		}

		const room = await prisma.room.create({
			data: {
				propertyId: data.propertyId,
				roomNumber: data.roomNumber,
				rentPrice: data.rentPrice,
				status: "vacant",
			},
		});

		return room;
	});

export const updateRoomFn = createServerFn({ method: "POST" })
	.inputValidator(UpdateRoomSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const room = await prisma.room.findUnique({
			where: { id: data.id },
			include: { property: true },
		});

		if (!room) throw new Error("Room not found");
		if (room.property.ownerId !== session.data.id) {
			throw new Error("Forbidden: You do not own this room");
		}

		// If updating room number, check for duplicates
		if (data.roomNumber && data.roomNumber !== room.roomNumber) {
			const existingRoom = await prisma.room.findUnique({
				where: {
					propertyId_roomNumber: {
						propertyId: room.propertyId,
						roomNumber: data.roomNumber,
					},
				},
			});

			if (existingRoom) {
				throw new Error(
					"A room with this number already exists in this property",
				);
			}
		}

		const updatedRoom = await prisma.room.update({
			where: { id: data.id },
			data: {
				...(data.roomNumber && { roomNumber: data.roomNumber }),
				...(data.rentPrice && { rentPrice: data.rentPrice }),
			},
		});

		return updatedRoom;
	});

export const deleteRoomFn = createServerFn({ method: "POST" })
	.inputValidator(DeleteRoomSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const room = await prisma.room.findUnique({
			where: { id: data.id },
			include: { property: true },
		});

		if (!room) throw new Error("Room not found");
		if (room.property.ownerId !== session.data.id) {
			throw new Error("Forbidden: You do not own this room");
		}

		if (room.status === "occupied") {
			throw new Error("Cannot delete an occupied room");
		}

		// Delete room and any inactive tenants/payments associated with it
		await prisma.$transaction(async (tx) => {
			const tenants = await tx.tenant.findMany({
				where: { roomId: data.id },
			});
			const tenantIds = tenants.map((t) => t.id);

			if (tenantIds.length > 0) {
				await tx.payment.deleteMany({
					where: { tenantId: { in: tenantIds } },
				});

				await tx.tenant.deleteMany({
					where: { roomId: data.id },
				});
			}

			await tx.room.delete({
				where: { id: data.id },
			});
		});

		return { success: true };
	});
