import { z } from "zod";

export const CreatePropertySchema = z.object({
	name: z.string().min(3, "Name is required"),
	address: z.string().min(1, "Address is required"),
});

export const UpdatePropertySchema = z.object({
	id: z.uuid("Invalid property ID"),
	name: z.string().min(1, "Name is required").optional(),
	address: z.string().min(1, "Address is required").optional(),
});

export const GetPropertySchema = z.object({
	id: z.uuid("Invalid property ID"),
});

export const DeletePropertySchema = z.object({
	id: z.uuid("Invalid property ID"),
});
