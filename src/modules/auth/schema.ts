import z from "zod";

export const LoginSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

export const RegisterSchema = z.object({
	email: z.email(),
	password: z.string().min(8, "Password must be at least 8 characters long"),
	name: z.string().min(1, "Name is required"),
});
