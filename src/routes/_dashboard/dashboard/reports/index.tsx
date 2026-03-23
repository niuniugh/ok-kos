import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/dashboard/reports/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Reports Feature Coming Soon!</div>;
}
