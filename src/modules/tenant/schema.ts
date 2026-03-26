import { z } from "zod";
import { FilterSchema } from "@/lib/filterSchema";

export const CreateTenantSchema = z.object({
	roomId: z.string().uuid("Invalid room ID"),
	name: z.string().min(1, "Name is required"),
	phone: z.string().min(1, "Phone is required"),
	moveInDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Move-in date must be in YYYY-MM-DD format"),
});

export const UpdateTenantSchema = z.object({
	id: z.string().uuid("Invalid tenant ID"),
	name: z.string().min(1, "Name is required").optional(),
	phone: z.string().min(1, "Phone is required").optional(),
	moveInDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Move-in date must be in YYYY-MM-DD format")
		.optional(),
});

export const MoveOutSchema = z.object({
	id: z.string().uuid("Invalid tenant ID"),
	moveOutDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Move-out date must be in YYYY-MM-DD format")
		.optional(),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
export type MoveOutInput = z.infer<typeof MoveOutSchema>;

export const GetTenantSchema = z.object({
	id: z.string().uuid("Invalid tenant ID"),
});

export const GetTenantsSchema = FilterSchema.extend({
	status: z.enum(["active", "inactive"]).optional(),
	propertyId: z.string().uuid("Invalid property ID").optional(),
});
