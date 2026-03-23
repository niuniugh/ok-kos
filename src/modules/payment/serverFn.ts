import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { useAppSession } from "../sessions/appSession";

export const getPaymentsFn = createServerFn().handler(async () => {
	const session = await useAppSession();
	if (!session.data?.id) throw new Error("Unauthorized");

	const count = await prisma.payment.count({
		where: {
			tenant: {
				room: {
					property: {
						ownerId: session.data.id,
					},
				},
			},
		},
	});

	return { count };
});
