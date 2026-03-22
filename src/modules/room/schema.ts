import { z } from "zod";

export const CreateRoomSchema = z.object({
	propertyId: z.string().uuid("Invalid property ID"),
	roomNumber: z.string().min(1, "Room number is required"),
	rentPrice: z.number().int().positive("Rent price must be a positive integer"),
});

export const UpdateRoomSchema = z.object({
	id: z.string().uuid("Invalid room ID"),
	roomNumber: z.string().min(1, "Room number is required").optional(),
	rentPrice: z
		.number()
		.int()
		.positive("Rent price must be a positive integer")
		.optional(),
});

export const GetRoomsSchema = z.object({
	propertyId: z.string().uuid("Invalid property ID"),
	status: z.enum(["vacant", "occupied"]).optional(),
});

export const GetRoomSchema = z.object({
	id: z.string().uuid("Invalid room ID"),
});

export const DeleteRoomSchema = z.object({
	id: z.string().uuid("Invalid room ID"),
});
