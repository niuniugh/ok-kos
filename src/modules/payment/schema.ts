import { z } from "zod";
import { FilterSchema } from "@/lib/filterSchema";

const paymentStatusEnum = z.enum(["paid", "unpaid", "partial"]);

function isConsistent(
	status: "paid" | "unpaid" | "partial",
	amountDue: number,
	amountPaid: number,
): boolean {
	if (status === "paid") return amountPaid >= amountDue;
	if (status === "unpaid") return amountPaid === 0;
	if (status === "partial") return amountPaid > 0 && amountPaid < amountDue;
	return true;
}

export const CreatePaymentSchema = z
	.object({
		tenantId: z.string().uuid("Invalid tenant ID"),
		month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
		amountDue: z
			.number()
			.int()
			.positive("Amount due must be a positive integer"),
		amountPaid: z.number().int().min(0, "Amount paid must be non-negative"),
		status: paymentStatusEnum,
	})
	.refine((d) => isConsistent(d.status, d.amountDue, d.amountPaid), {
		message: "amountPaid is inconsistent with status",
		path: ["amountPaid"],
	});

export const UpdatePaymentSchema = z
	.object({
		amountPaid: z.number().int().min(0).optional(),
		status: paymentStatusEnum.optional(),
	})
	.refine(
		(d) => {
			if (d.status === "unpaid" && d.amountPaid !== undefined) {
				return d.amountPaid === 0;
			}
			return true;
		},
		{
			message: "amountPaid is inconsistent with status",
			path: ["amountPaid"],
		},
	);

export const GetPaymentsSchema = FilterSchema.extend({
	tenantId: z.string().uuid("Invalid tenant ID").optional(),
	month: z
		.string()
		.regex(/^\d{4}-\d{2}$/)
		.optional(),
	status: paymentStatusEnum.optional(),
});

export const GetPaymentSchema = z.object({
	id: z.string().uuid("Invalid payment ID"),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;
