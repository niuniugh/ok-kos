import { createServerFn } from "@tanstack/react-start";
import { useAppSession } from "./appSession";

export const getCurrentSession = createServerFn().handler(async () => {
	const session = await useAppSession();
	return session.data;
});
