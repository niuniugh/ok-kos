import type { PaymentStatus } from "generated/prisma/enums";

export function deriveStatus(
	amountDue: number,
	amountPaid: number,
): PaymentStatus {
	if (amountPaid === 0) return "unpaid";
	if (amountPaid >= amountDue) return "paid";
	return "partial";
}

export function formatIDR(n: number) {
	return `Rp ${n.toLocaleString("id-ID")}`;
}

export function currentMonth() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
