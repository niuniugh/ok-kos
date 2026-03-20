import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { useAppSession } from "../sessions/appSession";
import { UpdateOwnerSchema } from "./schema";

export const getOwnerFn = createServerFn().handler(async () => {
	const session = await useAppSession();

	if (!session.data?.id) {
		throw new Error("Unauthorized");
	}

	const owner = await prisma.owner.findUnique({
		where: { id: session.data.id },
		select: {
			id: true,
			name: true,
			email: true,
			plan: true,
			createdAt: true,
		},
	});

	if (!owner) {
		throw new Error("Owner not found");
	}

	return owner;
});

export const updateOwnerFn = createServerFn({ method: "POST" })
	.inputValidator(UpdateOwnerSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession();

		if (!session.data?.id) {
			throw new Error("Unauthorized");
		}

		const updatedOwner = await prisma.owner
			.update({
				where: { id: session.data.id },
				data: {
					...(data.name && { name: data.name }),
					...(data.email && { email: data.email }),
				},
				select: {
					id: true,
					name: true,
					email: true,
					plan: true,
					createdAt: true,
				},
			})
			.catch((error: unknown) => {
				if (
					typeof error === "object" &&
					error !== null &&
					"code" in error &&
					error.code === "P2002"
				) {
					throw new Error("Email already in use");
				}
				throw error;
			});

		// Sync session with updated values
		await session.update({
			id: updatedOwner.id,
			name: updatedOwner.name,
			email: updatedOwner.email,
			plan: updatedOwner.plan,
		});

		return updatedOwner;
	});
