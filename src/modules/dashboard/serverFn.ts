import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { getOwnerById, verifyPropertyOwnership } from "@/modules/auth/helpers";
import { useAppSession } from "../sessions/appSession";
import { DashboardSummaryInputSchema } from "./schema";

function generateMonthRange(endMonth: string, count: number): string[] {
	const [y, m] = endMonth.split("-").map(Number);
	const months: string[] = [];
	for (let i = count - 1; i >= 0; i--) {
		const d = new Date(y, m - 1 - i, 1);
		months.push(
			`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
		);
	}
	return months;
}

export const getOwnerPropertiesFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const properties = await prisma.property.findMany({
			where: { ownerId: session.data.id },
			select: { id: true, name: true },
			orderBy: { createdAt: "asc" },
		});

		return properties;
	},
);

export const getDashboardSummaryFn = createServerFn({ method: "GET" })
	.inputValidator(DashboardSummaryInputSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const owner = await getOwnerById(session.data.id);

		const properties = await prisma.property.findMany({
			where: { ownerId: owner.id },
			select: { id: true, name: true },
		});

		const hasProperties = properties.length > 0;

		if (!hasProperties) {
			return {
				owner,
				property: null,
				hasProperties: false,
				month: data.month,
				stats: {
					totalRooms: 0,
					occupied: 0,
					vacant: 0,
					monthlyIncome: 0,
					totalCollected: 0,
					totalOutstanding: 0,
				},
				overdueTenants: [],
			};
		}

		// If propertyId is provided, verify ownership and query that property
		// If not provided, aggregate across ALL owner properties
		const propertyId = data.propertyId;
		const propertyFilter = propertyId
			? { propertyId }
			: { propertyId: { in: properties.map((p) => p.id) } };

		const property = propertyId
			? await verifyPropertyOwnership(owner.id, propertyId)
			: null;

		// Room counts
		const [totalRooms, occupied] = await Promise.all([
			prisma.room.count({ where: propertyFilter }),
			prisma.room.count({ where: { ...propertyFilter, status: "occupied" } }),
		]);

		// Payment totals for this property (or all) + month
		const payments = await prisma.payment.findMany({
			where: {
				month: data.month,
				tenant: {
					status: "active",
					room: propertyFilter,
				},
			},
			select: {
				amountDue: true,
				amountPaid: true,
				status: true,
				tenant: {
					select: {
						id: true,
						name: true,
						room: { select: { roomNumber: true } },
					},
				},
			},
		});

		const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
		const totalOutstanding = payments.reduce(
			(sum, p) => sum + (p.amountDue - p.amountPaid),
			0,
		);

		const overdueTenants = payments
			.filter((p) => p.status === "unpaid" || p.status === "partial")
			.map((p) => ({
				tenantId: p.tenant.id,
				tenantName: p.tenant.name,
				roomNumber: p.tenant.room.roomNumber,
				amountDue: p.amountDue,
				amountPaid: p.amountPaid,
				outstanding: p.amountDue - p.amountPaid,
				status: p.status,
			}));

		return {
			owner,
			property,
			hasProperties: true,
			month: data.month,
			stats: {
				totalRooms,
				occupied,
				vacant: totalRooms - occupied,
				monthlyIncome: totalCollected + totalOutstanding,
				totalCollected,
				totalOutstanding,
			},
			overdueTenants,
		};
	});

export const getIncomeTrendFn = createServerFn({ method: "GET" })
	.inputValidator(DashboardSummaryInputSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();
		if (!session.data?.id) throw new Error("Unauthorized");

		const owner = await getOwnerById(session.data.id);

		const properties = await prisma.property.findMany({
			where: { ownerId: owner.id },
			select: { id: true },
		});

		if (properties.length === 0) return [];

		const propertyId = data.propertyId;
		if (propertyId) {
			await verifyPropertyOwnership(owner.id, propertyId);
		}
		const propertyFilter = propertyId
			? { propertyId }
			: { propertyId: { in: properties.map((p) => p.id) } };

		const months = generateMonthRange(data.month, 6);

		const payments = await prisma.payment.findMany({
			where: {
				month: { in: months },
				tenant: {
					status: "active",
					room: propertyFilter,
				},
			},
			select: {
				month: true,
				amountDue: true,
				amountPaid: true,
			},
		});

		const grouped = new Map<
			string,
			{ collected: number; outstanding: number }
		>();
		for (const m of months) {
			grouped.set(m, { collected: 0, outstanding: 0 });
		}
		for (const p of payments) {
			const entry = grouped.get(p.month);
			if (entry) {
				entry.collected += p.amountPaid;
				entry.outstanding += p.amountDue - p.amountPaid;
			}
		}

		return months.map((m) => {
			const entry = grouped.get(m) ?? { collected: 0, outstanding: 0 };
			return {
				month: m,
				collected: entry.collected,
				outstanding: entry.outstanding,
			};
		});
	});
