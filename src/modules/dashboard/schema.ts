import z from "zod";

export const DashboardSummaryInputSchema = z.object({
	propertyId: z.string().uuid("Invalid property ID").optional(),
	month: z
		.string()
		.regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
});
