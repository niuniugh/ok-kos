import z from "zod";

export const LoginSchema = z.object({
	email: z.email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
	email: z.email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters long"),
	name: z.string().min(1, "Name is required"),
});
