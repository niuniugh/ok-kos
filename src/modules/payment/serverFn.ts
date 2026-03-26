import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { useAppSession } from "../sessions/appSession";
import {
	CreatePaymentSchema,
	GetPaymentSchema,
	GetPaymentsSchema,
	UpdatePaymentSchema,
} from "./schema";

export const getPaymentsFn = createServerFn({ method: "GET" })
	.inputValidator(GetPaymentsSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const page = data.page ?? 1;
		const limit = data.limit ?? 20;

		const where = {
			...(data.status ? { status: data.status } : {}),
			...(data.month ? { month: data.month } : {}),
			tenant: {
				...(data.tenantId ? { id: data.tenantId } : {}),
				room: {
					property: { ownerId: session.data.id },
				},
			},
		};

		const [payments, total] = await prisma.$transaction([
			prisma.payment.findMany({
				where,
				take: limit,
				skip: (page - 1) * limit,
				include: {
					tenant: {
						include: {
							room: {
								select: {
									roomNumber: true,
									rentPrice: true,
									property: { select: { id: true, name: true } },
								},
							},
						},
					},
				},
				orderBy: [{ month: "desc" }, { createdAt: "desc" }],
			}),
			prisma.payment.count({ where }),
		]);

		return {
			data: payments.map((p) => ({
				id: p.id,
				tenantId: p.tenantId,
				tenantName: p.tenant.name,
				roomNumber: p.tenant.room.roomNumber,
				propertyName: p.tenant.room.property.name,
				month: p.month,
				amountDue: p.amountDue,
				amountPaid: p.amountPaid,
				status: p.status,
				paidAt: p.paidAt,
				createdAt: p.createdAt,
			})),
			meta: { page, limit, total },
		};
	});

export const getPaymentFn = createServerFn({ method: "GET" })
	.inputValidator(GetPaymentSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();

		const payment = await prisma.payment.findFirst({
			where: {
				id: data.id,
				tenant: {
					room: { property: { ownerId: session.data.id } },
				},
			},
			include: {
				tenant: {
					include: {
						room: {
							select: {
								roomNumber: true,
								property: { select: { id: true, name: true } },
							},
						},
					},
				},
			},
		});

		if (!payment) throw new Error("Payment not found");

		return {
			id: payment.id,
			tenantId: payment.tenantId,
			tenantName: payment.tenant.name,
			roomNumber: payment.tenant.room.roomNumber,
			propertyName: payment.tenant.room.property.name,
			month: payment.month,
			amountDue: payment.amountDue,
			amountPaid: payment.amountPaid,
			status: payment.status,
			paidAt: payment.paidAt,
			createdAt: payment.createdAt,
		};
	});

export const createPaymentFn = createServerFn({ method: "POST" })
	.inputValidator(CreatePaymentSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();

		const tenant = await prisma.tenant.findFirst({
			where: {
				id: data.tenantId,
				room: { property: { ownerId: session.data.id } },
			},
		});

		if (!tenant) throw new Error("Tenant not found");

		const payment = await prisma.payment.create({
			data: {
				tenantId: data.tenantId,
				month: data.month,
				amountDue: data.amountDue,
				amountPaid: data.amountPaid,
				status: data.status,
				paidAt: data.status === "paid" ? new Date() : null,
			},
		});

		return { payment };
	});

export const updatePaymentFn = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({ id: z.string().uuid() }).merge(UpdatePaymentSchema),
	)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		const { id, ...fields } = data;

		const existing = await prisma.payment.findFirst({
			where: {
				id,
				tenant: { room: { property: { ownerId: session.data.id } } },
			},
		});

		if (!existing) throw new Error("Payment not found");

		const newAmountPaid = fields.amountPaid ?? existing.amountPaid;
		const newStatus = fields.status ?? existing.status;

		if (newStatus === "paid" && newAmountPaid < existing.amountDue) {
			throw new Error("amountPaid is inconsistent with status");
		}
		if (newStatus === "unpaid" && newAmountPaid !== 0) {
			throw new Error("amountPaid is inconsistent with status");
		}
		if (
			newStatus === "partial" &&
			!(newAmountPaid > 0 && newAmountPaid < existing.amountDue)
		) {
			throw new Error("amountPaid is inconsistent with status");
		}
		let paidAt = existing.paidAt;
		if (newStatus === "paid" && !existing.paidAt) paidAt = new Date();
		else if (newStatus !== "paid") paidAt = null;

		const payment = await prisma.payment.update({
			where: { id },
			data: { amountPaid: newAmountPaid, status: newStatus, paidAt },
		});

		return { payment };
	});
