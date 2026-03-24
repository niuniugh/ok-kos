import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { verifyPropertyOwnership } from "@/modules/auth/helpers";
import { useAppSession } from "../sessions/appSession";
import { ReportSummaryInputSchema } from "./schema";

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
