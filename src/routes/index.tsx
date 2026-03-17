import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentSession } from "@/modules/sessions/serverFn";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const session = await getCurrentSession();
		if (session.email) {
			throw redirect({ to: "/dashboard" });
		}
		throw redirect({ to: "/login" });
	},
});
