import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/_dashboard/dashboard")({
	component: DashboardLayout,
});

function DashboardLayout() {
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);

	return (
		<div className="flex min-h-screen bg-background">
			{/* OVERLAY (mobile) */}
			{isMobile && open && (
				<button
					type="button"
					className="fixed inset-0 bg-black/50 z-40"
					onClick={() => setOpen(false)}
				/>
			)}

			{/* SIDEBAR */}
			<div
				className={`
          fixed z-50 h-full w-64 bg-sidebar border-r border-sidebar-border p-4
          transition-transform duration-300
          ${isMobile ? (open ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
        `}
			>
				<AppSidebar />
			</div>

			{/* MAIN CONTENT */}
			<div
				className={`flex-1 ${isMobile ? "ml-0" : "ml-64"} p-6 transition-all duration-300`}
			>
				{/* BUTTON (mobile) */}
				{isMobile && (
					<button
						type="button"
						onClick={() => setOpen(true)}
						className="mb-4 px-3 py-2 bg-secondary text-secondary-foreground rounded shadow-md"
					>
						☰ Menu
					</button>
				)}

				<Outlet />
			</div>
		</div>
	);
}
