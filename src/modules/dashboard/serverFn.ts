import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { getOwnerById, verifyPropertyOwnership } from "@/modules/auth/helpers";
import { useAppSession } from "../sessions/appSession";
import { DashboardSummaryInputSchema } from "./schema";

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

		// Use provided propertyId or fall back to first property
		const propertyId = data.propertyId ?? properties[0].id;
		const property = await verifyPropertyOwnership(owner.id, propertyId);

		// Room counts
		const [totalRooms, occupied] = await Promise.all([
			prisma.room.count({ where: { propertyId } }),
			prisma.room.count({ where: { propertyId, status: "occupied" } }),
		]);

		// Payment totals for this property + month
		const payments = await prisma.payment.findMany({
			where: {
				month: data.month,
				tenant: {
					status: "active",
					room: { propertyId },
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
