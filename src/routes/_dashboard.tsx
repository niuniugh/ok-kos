import {
	createFileRoute,
	Outlet,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getCurrentSession } from "@/modules/sessions/serverFn";

export const Route = createFileRoute("/_dashboard")({
	ssr: true,
	component: RouteComponent,
	pendingComponent: PendingComponent,
	errorComponent: ErrorComponent,
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

function ErrorComponent({ error }: { error: Error }) {
	const router = useRouter();
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<AlertCircle className="h-10 w-10 text-destructive" />
			<p>{error.message || "Something went wrong."}</p>
			<Button variant="outline" onClick={() => router.invalidate()}>
				Try again
			</Button>
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
