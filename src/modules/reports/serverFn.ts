import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { verifyPropertyOwnership } from "@/modules/auth/helpers";
import { useAppSession } from "../sessions/appSession";
import { GetReportAnalyticsSchema, ReportSummaryInputSchema } from "./schema";

export const getReportSummaryFn = createServerFn({ method: "GET" })
	.inputValidator(ReportSummaryInputSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const property = await verifyPropertyOwnership(
			session.data.id,
			data.propertyId,
		);

		// Room counts
		const [totalRooms, occupied] = await Promise.all([
			prisma.room.count({ where: { propertyId: data.propertyId } }),
			prisma.room.count({
				where: { propertyId: data.propertyId, status: "occupied" },
			}),
		]);

		const vacant = totalRooms - occupied;
		const occupancyRate =
			totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

		// Full payment breakdown per tenant for this property + month
		const payments = await prisma.payment.findMany({
			where: {
				month: data.month,
				tenant: {
					room: { propertyId: data.propertyId },
				},
			},
			select: {
				id: true,
				amountDue: true,
				amountPaid: true,
				status: true,
				paidAt: true,
				tenant: {
					select: {
						id: true,
						name: true,
						room: { select: { roomNumber: true } },
					},
				},
			},
			orderBy: { tenant: { name: "asc" } },
		});

		const totalDue = payments.reduce((sum, p) => sum + p.amountDue, 0);
		const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
		const totalOutstanding = totalDue - totalCollected;

		const breakdown = payments.map((p) => ({
			paymentId: p.id,
			tenantId: p.tenant.id,
			tenantName: p.tenant.name,
			roomNumber: p.tenant.room.roomNumber,
			amountDue: p.amountDue,
			amountPaid: p.amountPaid,
			outstanding: p.amountDue - p.amountPaid,
			status: p.status,
			paidAt: p.paidAt,
		}));

		return {
			property,
			month: data.month,
			stats: {
				totalRooms,
				occupied,
				vacant,
				occupancyRate,
				totalDue,
				totalCollected,
				totalOutstanding,
			},
			breakdown,
		};
	});

function generateLast12Months(): string[] {
	const now = new Date();
	const months: string[] = [];
	for (let i = 11; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		months.push(
			`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
		);
	}
	return months;
}

export const getReportAnalyticsFn = createServerFn({ method: "GET" })
	.inputValidator(GetReportAnalyticsSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const ownerId = session.data.id;

		const propertyFilter = data.propertyId
			? { id: data.propertyId, ownerId }
			: { ownerId };

		const months = generateLast12Months();

		const [payments, totalRooms, occupiedRooms, properties] =
			await prisma.$transaction([
				prisma.payment.findMany({
					where: {
						month: { in: months },
						tenant: {
							room: { property: propertyFilter },
						},
					},
					select: {
						month: true,
						amountDue: true,
						amountPaid: true,
					},
				}),
				prisma.room.count({
					where: { property: propertyFilter },
				}),
				prisma.room.count({
					where: { property: propertyFilter, status: "occupied" },
				}),
				prisma.property.findMany({
					where: { ownerId },
					select: { id: true, name: true },
					orderBy: { createdAt: "asc" },
				}),
			]);

		const grouped = new Map<
			string,
			{ totalDue: number; totalCollected: number; tenantCount: number }
		>();
		for (const m of months) {
			grouped.set(m, { totalDue: 0, totalCollected: 0, tenantCount: 0 });
		}
		for (const p of payments) {
			const entry = grouped.get(p.month);
			if (entry) {
				entry.totalDue += p.amountDue;
				entry.totalCollected += p.amountPaid;
				entry.tenantCount++;
			}
		}

		const monthlyData = months.map((m) => {
			const entry = grouped.get(m) ?? {
				totalDue: 0,
				totalCollected: 0,
				tenantCount: 0,
			};
			return {
				month: m,
				totalDue: entry.totalDue,
				totalCollected: entry.totalCollected,
				totalOutstanding: entry.totalDue - entry.totalCollected,
				collectionRate:
					entry.totalDue > 0
						? Math.round((entry.totalCollected / entry.totalDue) * 100)
						: 0,
				tenantCount: entry.tenantCount,
			};
		});

		const totalIncome = monthlyData.reduce((s, m) => s + m.totalDue, 0);
		const totalCollected = monthlyData.reduce(
			(s, m) => s + m.totalCollected,
			0,
		);
		const monthsWithData = monthlyData.filter((m) => m.totalDue > 0);
		const avgCollectionRate =
			monthsWithData.length > 0
				? Math.round(
						monthsWithData.reduce((s, m) => s + m.collectionRate, 0) /
							monthsWithData.length,
					)
				: 0;
		const occupancyRate =
			totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

		return {
			months: monthlyData,
			overall: {
				totalIncome,
				totalCollected,
				avgCollectionRate,
				occupancyRate,
			},
			properties,
		};
	});
