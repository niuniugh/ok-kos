import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getOwnerFn } from "@/modules/owner/serverFn";
import { getPaymentsFn } from "@/modules/payment/serverFn";
import { getPropertiesFn } from "@/modules/property/serverFn";
import { getTenantsFn } from "@/modules/tenant/serverFn";

export const Route = createFileRoute("/_dashboard/dashboard/")({
	component: DashboardPage,
});

function DashboardPage() {
	// Fetch owner info
	const { data: owner } = useQuery({
		queryKey: ["owner"],
		queryFn: getOwnerFn,
	});

	// Fetch counts
	const { data: properties } = useQuery({
		queryKey: ["properties-count"],
		queryFn: getPropertiesFn,
	});
	const { data: tenants } = useQuery<{ count: number }>({
		queryKey: ["tenants-count"],
		queryFn: getTenantsFn,
	});
	const { data: payments } = useQuery<{ count: number }>({
		queryKey: ["payments-count"],
		queryFn: getPaymentsFn,
	});

	return (
		<div className="space-y-6">
			{/* Greeting */}
			<div>
				<h1 className="text-2xl font-bold text-white">
					Welcome, {owner?.name} 👋
				</h1>
				<p className="text-gray-400">Here’s your dashboard overview</p>
			</div>

			{/* Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition">
					<p className="text-sm text-gray-400">🏠 Properties</p>
					<h2 className="text-2xl font-semibold text-white">
						{properties?.length ?? 0}
					</h2>
				</div>

				<div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition">
					<p className="text-sm text-gray-400">👥 Tenants</p>
					<h2 className="text-2xl font-semibold text-white">
						{tenants?.count ?? 0}
					</h2>
				</div>

				<div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition">
					<p className="text-sm text-gray-400">💳 Payments</p>
					<h2 className="text-2xl font-semibold text-white">
						{payments?.count ?? 0}
					</h2>
				</div>
			</div>
		</div>
	);
}
