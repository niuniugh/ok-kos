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

export function shiftMonth(month: string, offset: number) {
	const [y, m] = month.split("-").map(Number);
	const d = new Date(y, m - 1 + offset, 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(month: string) {
	const [y, m] = month.split("-").map(Number);
	return new Date(y, m - 1).toLocaleString("default", {
		month: "long",
		year: "numeric",
	});
}
