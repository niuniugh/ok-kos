import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/dashboard/tenants/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Tenants Feature Coming Soon!</div>;
}
