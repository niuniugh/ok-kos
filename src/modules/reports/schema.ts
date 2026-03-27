import z from "zod";

export const ReportSummaryInputSchema = z.object({
	propertyId: z.string().uuid("Invalid property ID"),
	month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
});

export const GetReportAnalyticsSchema = z.object({
	propertyId: z.string().uuid("Invalid property ID").optional(),
});
