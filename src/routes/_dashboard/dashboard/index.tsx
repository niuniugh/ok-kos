import { createFileRoute, useRouter } from "@tanstack/react-router";
import { logoutFn } from "@/modules/auth/serverFn";

export const Route = createFileRoute("/_dashboard/dashboard/")({
	component: RouteComponent,
});

function RouteComponent() {
	const router = useRouter();

	const handleLogout = async () => {
		await logoutFn();
		await router.navigate({ to: "/login" });
	};

	return (
		<div>
			<button type="button" onClick={handleLogout}>
				Logout
			</button>
		</div>
	);
}
