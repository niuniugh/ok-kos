import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { useAppSession } from "../sessions/appSession";
import {
	CreatePaymentSchema,
	GetMonthlyPaymentSummarySchema,
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
		if (!session.data?.id) throw new Error("Unauthorized");

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
		if (!session.data?.id) throw new Error("Unauthorized");

		const tenant = await prisma.tenant.findFirst({
			where: {
				id: data.tenantId,
				room: { property: { ownerId: session.data.id } },
			},
		});

		if (!tenant) throw new Error("Tenant not found");

		const payment = await prisma.payment.upsert({
			where: {
				tenantId_month: {
					tenantId: data.tenantId,
					month: data.month,
				},
			},
			update: {
				amountDue: data.amountDue,
				amountPaid: data.amountPaid,
				status: data.status,
				paidAt: data.status === "paid" ? new Date() : null,
			},
			create: {
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
		if (!session.data?.id) throw new Error("Unauthorized");
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

export const getMonthlyPaymentSummaryFn = createServerFn({ method: "GET" })
	.inputValidator(GetMonthlyPaymentSummarySchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const ownerId = session.data.id;

		const propertyFilter = data.propertyId
			? { id: data.propertyId, ownerId }
			: { ownerId };

		const [tenants, payments, properties] = await prisma.$transaction([
			prisma.tenant.findMany({
				where: {
					status: "active",
					room: { property: propertyFilter },
				},
				include: {
					room: {
						select: {
							roomNumber: true,
							rentPrice: true,
							property: { select: { id: true, name: true } },
						},
					},
				},
				orderBy: [
					{ room: { property: { name: "asc" } } },
					{ room: { roomNumber: "asc" } },
				],
			}),
			prisma.payment.findMany({
				where: {
					month: data.month,
					tenant: {
						status: "active",
						room: { property: propertyFilter },
					},
				},
				select: {
					id: true,
					tenantId: true,
					amountDue: true,
					amountPaid: true,
					status: true,
					paidAt: true,
				},
			}),
			prisma.property.findMany({
				where: { ownerId },
				select: { id: true, name: true },
				orderBy: { createdAt: "asc" },
			}),
		]);

		const paymentMap = new Map(payments.map((p) => [p.tenantId, p]));

		const tenantRows = tenants
			.filter((t) => {
				const moveIn = `${t.moveInDate.getFullYear()}-${String(t.moveInDate.getMonth() + 1).padStart(2, "0")}`;
				return moveIn <= data.month;
			})
			.map((t) => {
				const payment = paymentMap.get(t.id);
				return {
					tenantId: t.id,
					tenantName: t.name,
					roomNumber: t.room.roomNumber,
					propertyId: t.room.property.id,
					propertyName: t.room.property.name,
					rentPrice: t.room.rentPrice,
					paymentId: payment?.id ?? null,
					amountDue: payment?.amountDue ?? t.room.rentPrice,
					amountPaid: payment?.amountPaid ?? 0,
					status: (payment?.status as string) ?? "no_record",
					paidAt: payment?.paidAt ?? null,
				};
			});

		const summary = {
			totalTenants: tenantRows.length,
			paidCount: tenantRows.filter((t) => t.status === "paid").length,
			partialCount: tenantRows.filter((t) => t.status === "partial").length,
			unpaidCount: tenantRows.filter(
				(t) => t.status === "unpaid" || t.status === "no_record",
			).length,
			totalDue: tenantRows.reduce((s, t) => s + t.amountDue, 0),
			totalCollected: tenantRows.reduce((s, t) => s + t.amountPaid, 0),
		};

		return { summary, tenants: tenantRows, properties };
	});
