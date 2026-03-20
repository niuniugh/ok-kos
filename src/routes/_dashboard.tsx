import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Spinner } from "@/components/ui/spinner";
import { getCurrentSession } from "@/modules/sessions/serverFn";

export const Route = createFileRoute("/_dashboard")({
	ssr: true,
	component: RouteComponent,
	pendingComponent: PendingComponent,
	beforeLoad: async () => {
		try {
			const session = await getCurrentSession();
			if (!session.email) {
				throw redirect({ to: "/login" });
			}
		} catch (error) {
			if (error instanceof Response) throw error;
			throw redirect({ to: "/login" });
		}
	},
});

function PendingComponent() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<Spinner />
		</div>
	);
}

function RouteComponent() {
	return (
		<div>
			<Outlet />
		</div>
	);
}
