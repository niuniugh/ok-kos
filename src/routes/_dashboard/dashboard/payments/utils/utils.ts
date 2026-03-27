import type { PaymentStatus } from "generated/prisma/enums";

export function deriveStatus(
	amountDue: number,
	amountPaid: number,
): PaymentStatus {
	if (amountPaid === 0) return "unpaid";
	if (amountPaid >= amountDue) return "paid";
	return "partial";
}

export { currentMonth, formatIDR } from "@/lib/utils";
