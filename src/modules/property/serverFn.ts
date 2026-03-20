import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { useAppSession } from "../sessions/appSession";

export const getPropertiesFn = createServerFn().handler(async () => {
	const session = await useAppSession();
	if (!session.data?.id) throw new Error("Unauthorized");

	const count = await prisma.property.count({
		where: { ownerId: session.data.id },
	});

	return { count };
});
