import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseServerError } from "@/lib/utils";
import { logoutFn } from "@/modules/auth/serverFn";

export const Route = createFileRoute("/_dashboard/dashboard/")({
	component: RouteComponent,
});

function RouteComponent() {
	const router = useRouter();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await logoutFn();
			await router.navigate({ to: "/login" });
		} catch (error) {
			toast.error(parseServerError(error));
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<div>
			<Button
				type="button"
				variant="outline"
				disabled={isLoggingOut}
				onClick={handleLogout}
			>
				{isLoggingOut ? "Logging out..." : "Logout"}
			</Button>
		</div>
	);
}
