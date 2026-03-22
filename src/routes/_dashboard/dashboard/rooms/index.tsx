import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_dashboard/dashboard/rooms/")({
	component: RoomsRedirectPage,
});

// Since rooms are managed within the context of a property,
// we redirect the global /rooms route to the properties list.
function RoomsRedirectPage() {
	const navigate = useNavigate();

	useEffect(() => {
		navigate({ to: "/dashboard/properties", replace: true });
	}, [navigate]);

	return null;
}
