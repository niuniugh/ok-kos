import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/dashboard/payments/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Payments Feature Coming Soon!</div>;
}
