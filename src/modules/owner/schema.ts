import z from "zod";

export const UpdateOwnerSchema = z
	.object({
		name: z.string().min(1, "Name is required").optional(),
		email: z.email("Invalid email format").optional(),
	})
	.refine((data) => data.name !== undefined || data.email !== undefined, {
		message: "At least one field must be provided",
	});
