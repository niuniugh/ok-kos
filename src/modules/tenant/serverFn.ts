import { createServerFn } from "@tanstack/react-start";
import type { Prisma } from "generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { useAppSession } from "../sessions/appSession";
import {
	CreateTenantSchema,
	GetTenantSchema,
	GetTenantsSchema,
	MoveOutSchema,
	UpdateTenantSchema,
} from "./schema";

export const getTenantsFn = createServerFn({ method: "GET" })
	.inputValidator(GetTenantsSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const where: Prisma.TenantWhereInput = {
			...(data.status ? { status: data.status } : {}),
			room: {
				property: {
					ownerId: session.data.id, // fix 4
					...(data.propertyId ? { id: data.propertyId } : {}),
				},
			},
		};

		const page = data.page ?? 1;
		const limit = data.limit ?? 20;

		const [tenants, total] = await prisma.$transaction([
			prisma.tenant.findMany({
				where,
				take: limit,
				skip: (page - 1) * limit,
				include: {
					room: {
						include: {
							property: { select: { id: true, name: true } },
						},
					},
				},
				orderBy: { createdAt: "desc" },
			}),
			prisma.tenant.count({ where }),
		]);

		return {
			data: tenants.map((t) => ({
				id: t.id,
				roomId: t.roomId,
				roomNumber: t.room.roomNumber,
				rentPrice: t.room.rentPrice,
				propertyId: t.room.property.id,
				propertyName: t.room.property.name,
				name: t.name,
				phone: t.phone,
				moveInDate: t.moveInDate,
				moveOutDate: t.moveOutDate,
				status: t.status,
				createdAt: t.createdAt,
			})),
			meta: { total, page, limit },
		};
	});

export const getTenantFn = createServerFn({ method: "GET" })
	.inputValidator(GetTenantSchema) // fix 2
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const tenant = await prisma.tenant.findFirst({
			where: {
				id: data.id,
				room: {
					property: { ownerId: session.data.id }, // fix 4
				},
			},
			include: {
				room: {
					include: {
						property: { select: { id: true, name: true } },
					},
				},
			},
		});

		if (!tenant) throw new Error("Tenant not found");

		return { tenant };
	});

export const createTenantFn = createServerFn({ method: "POST" })
	.inputValidator(CreateTenantSchema) // fix 2
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const vacancy = await prisma.room.findFirst({
			where: {
				id: data.roomId,
				status: "vacant",
				property: { ownerId: session.data.id },
			},
		});

		if (!vacancy) throw new Error("Room is occupied or not found");

		const [tenant] = await prisma.$transaction([
			prisma.tenant.create({
				data: {
					roomId: data.roomId,
					name: data.name,
					phone: data.phone,
					moveInDate: new Date(data.moveInDate),
					status: "active",
				},
			}),
			prisma.room.update({
				where: { id: data.roomId },
				data: { status: "occupied" },
			}),
		]);

		return { tenant };
	});

export const updateTenantFn = createServerFn({ method: "POST" })
	.inputValidator(UpdateTenantSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const { id, ...fields } = data;

		const existing = await prisma.tenant.findFirst({
			where: {
				id,
				room: { property: { ownerId: session.data.id } },
			},
		});

		if (!existing) throw new Error("Tenant not found");

		const updatedTenant = await prisma.tenant.update({
			where: { id }, // fix 8
			data: {
				...(fields.name ? { name: fields.name } : {}),
				...(fields.phone ? { phone: fields.phone } : {}),
				...(fields.moveInDate
					? { moveInDate: new Date(fields.moveInDate) }
					: {}),
			},
		});

		return { updatedTenant };
	});

export const moveOutTenantFn = createServerFn({ method: "POST" })
	.inputValidator(MoveOutSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const { id, moveOutDate } = data;

		const tenant = await prisma.tenant.findFirst({
			where: {
				id,
				room: { property: { ownerId: session.data.id } },
			},
		});

		if (!tenant) throw new Error("Tenant not found");

		if (tenant.status === "inactive")
			throw new Error("Tenant is already inactive");

		const resolvedMoveOutDate = moveOutDate
			? new Date(moveOutDate)
			: new Date();

		const [updatedTenant] = await prisma.$transaction([
			prisma.tenant.update({
				where: { id },
				data: {
					status: "inactive",
					moveOutDate: resolvedMoveOutDate,
				},
			}),
			prisma.room.update({
				where: { id: tenant.roomId },
				data: { status: "vacant" },
			}),
		]);

		return {
			id: updatedTenant.id,
			status: updatedTenant.status,
			moveOutDate: updatedTenant.moveOutDate,
		};
	});
