import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/dashboard/properties/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Properties Feature Coming Soon!</div>;
}
