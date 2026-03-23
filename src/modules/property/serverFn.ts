import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { useAppSession } from "../sessions/appSession";
import {
	CreatePropertySchema,
	DeletePropertySchema,
	GetPropertySchema,
	UpdatePropertySchema,
} from "./schema";

export const getPropertiesFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const properties = await prisma.property.findMany({
			where: { ownerId: session.data.id },
			orderBy: { createdAt: "desc" },
			include: {
				_count: {
					select: { rooms: true },
				},
			},
		});

		return properties;
	},
);

export const getPropertyFn = createServerFn({ method: "GET" })
	.inputValidator(GetPropertySchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const property = await prisma.property.findUnique({
			where: { id: data.id },
			include: {
				rooms: true,
			},
		});

		if (!property) {
			throw new Error("Property not found");
		}

		if (property.ownerId !== session.data.id) {
			throw new Error("Forbidden: You do not own this property");
		}

		return property;
	});

export const createPropertyFn = createServerFn({ method: "POST" })
	.inputValidator(CreatePropertySchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const property = await prisma.property.create({
			data: {
				name: data.name,
				address: data.address,
				ownerId: session.data.id,
			},
		});

		return property;
	});

export const updatePropertyFn = createServerFn({ method: "POST" })
	.inputValidator(UpdatePropertySchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const property = await prisma.property.findUnique({
			where: { id: data.id },
		});

		if (!property) {
			throw new Error("Property not found");
		}

		if (property.ownerId !== session.data.id) {
			throw new Error("Forbidden: You do not own this property");
		}

		const updatedProperty = await prisma.property.update({
			where: { id: data.id },
			data: {
				...(data.name && { name: data.name }),
				...(data.address && { address: data.address }),
			},
		});

		return updatedProperty;
	});

export const deletePropertyFn = createServerFn({ method: "POST" })
	.inputValidator(DeletePropertySchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const property = await prisma.property.findUnique({
			where: { id: data.id },
			include: {
				rooms: {
					include: {
						tenants: {
							where: { status: "active" },
						},
					},
				},
			},
		});

		if (!property) {
			throw new Error("Property not found");
		}

		if (property.ownerId !== session.data.id) {
			throw new Error("Forbidden: You do not own this property");
		}

		// Check if any room has an active tenant
		const hasActiveTenants = property.rooms.some(
			(room) => room.tenants.length > 0,
		);

		if (hasActiveTenants) {
			throw new Error(
				"Cannot delete property: There are rooms with active tenants",
			);
		}

		// Delete property and all its nested relations
		await prisma.$transaction(async (tx) => {
			const roomIds = property.rooms.map((r) => r.id);

			if (roomIds.length > 0) {
				const tenants = await tx.tenant.findMany({
					where: { roomId: { in: roomIds } },
				});
				const tenantIds = tenants.map((t) => t.id);

				if (tenantIds.length > 0) {
					await tx.payment.deleteMany({
						where: { tenantId: { in: tenantIds } },
					});

					await tx.tenant.deleteMany({
						where: { roomId: { in: roomIds } },
					});
				}

				await tx.room.deleteMany({
					where: { propertyId: data.id },
				});
			}

			await tx.property.delete({
				where: { id: data.id },
			});
		});

		return { success: true };
	});
