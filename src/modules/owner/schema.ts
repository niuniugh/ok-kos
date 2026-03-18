import z from "zod";

export const UpdateOwnerSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	email: z.email("Invalid email format").optional(),
});
