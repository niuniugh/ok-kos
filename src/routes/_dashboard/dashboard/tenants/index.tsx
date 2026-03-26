import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Phone, PlusIcon, Users } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getPropertiesFn } from "@/modules/property/serverFn";
import { getTenantsFn } from "@/modules/tenant/serverFn";
import { CreateTenantDialog } from "./components/create-tenants";
import { EditTenantDialog } from "./components/edit-tenant";
import { MoveOutDialog } from "./components/move-out-dialog";

export const Route = createFileRoute("/_dashboard/dashboard/tenants/")({
	component: TenantsPage,
});

function TenantsPage() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [propertyFilter, setPropertyFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");

	const { data: propertiesRes } = useQuery({
		queryKey: ["properties"],
		queryFn: () => getPropertiesFn(),
	});
	const properties = propertiesRes ?? [];

	const { data: tenantsRes, isLoading } = useQuery({
		queryKey: ["tenants", propertyFilter, statusFilter],
		queryFn: () =>
			getTenantsFn({
				data: {
					propertyId: propertyFilter !== "all" ? propertyFilter : undefined,
					status:
						statusFilter !== "all"
							? (statusFilter as "active" | "inactive")
							: undefined,
				},
			}),
	});
	const tenants = tenantsRes?.data ?? [];

	const formatDate = (d: Date | string | null) => {
		if (!d) return "—";
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString("id-ID", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-white">Tenants</h1>
					<p className="text-gray-400">Manage your tenants</p>
				</div>
				<Button
					className="bg-blue-600 hover:bg-blue-700 text-white"
					onClick={() => setIsCreateOpen(true)}
				>
					<PlusIcon className="w-4 h-4 mr-2" />
					Add Tenant
				</Button>
			</div>

			{/* Filters */}
			<div className="flex gap-3 flex-wrap">
				<Select value={propertyFilter} onValueChange={setPropertyFilter}>
					<SelectTrigger className="w-48 bg-zinc-900 border-zinc-700 text-white">
						<SelectValue placeholder="All properties" />
					</SelectTrigger>
					<SelectContent className="bg-zinc-800 border-zinc-700">
						<SelectItem value="all" className="text-white focus:bg-zinc-700">
							All properties
						</SelectItem>
						{properties.map((p) => (
							<SelectItem
								key={p.id}
								value={p.id}
								className="text-white focus:bg-zinc-700"
							>
								{p.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-40 bg-zinc-900 border-zinc-700 text-white">
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent className="bg-zinc-800 border-zinc-700">
						<SelectItem value="all" className="text-white focus:bg-zinc-700">
							All statuses
						</SelectItem>
						<SelectItem value="active" className="text-white focus:bg-zinc-700">
							Active
						</SelectItem>
						<SelectItem
							value="inactive"
							className="text-white focus:bg-zinc-700"
						>
							Inactive
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="text-gray-400 text-sm py-10">Loading tenants...</div>
			) : tenants.length === 0 ? (
				<EmptyState
					icon={Users}
					title="No tenants yet"
					description="Add your first tenant to start tracking rent and payments."
					actionLabel="Add Tenant"
					onAction={() => setIsCreateOpen(true)}
				/>
			) : (
				<div className="border border-zinc-800 rounded-lg overflow-hidden">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-800 bg-zinc-900/50">
								<th className="text-left px-4 py-3 text-gray-400 font-medium">
									Name
								</th>
								<th className="text-left px-4 py-3 text-gray-400 font-medium">
									Phone
								</th>
								<th className="text-left px-4 py-3 text-gray-400 font-medium">
									Room
								</th>
								<th className="text-left px-4 py-3 text-gray-400 font-medium">
									Property
								</th>
								<th className="text-left px-4 py-3 text-gray-400 font-medium">
									Move-in
								</th>
								<th className="text-left px-4 py-3 text-gray-400 font-medium">
									Status
								</th>
								<th className="text-right px-4 py-3 text-gray-400 font-medium">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{tenants.map((t, i) => (
								<tr
									key={t.id}
									className={[
										"border-b border-zinc-800 last:border-0 transition-colors",
										t.status === "inactive"
											? "opacity-50"
											: "hover:bg-zinc-800/40",
										i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/60",
									].join(" ")}
								>
									<td className="px-4 py-3">
										<Link
											to="/dashboard/tenants/$tenantId"
											params={{ tenantId: t.id }}
											className="text-white hover:text-blue-400 font-medium transition-colors"
										>
											{t.name}
										</Link>
									</td>
									<td className="px-4 py-3 text-gray-300">
										<span className="flex items-center gap-1.5">
											<Phone className="w-3 h-3 text-gray-500" />
											{t.phone}
										</span>
									</td>
									<td className="px-4 py-3 text-gray-300">
										<span className="flex items-center gap-1.5">
											<Home className="w-3 h-3 text-gray-500" />
											{t.roomNumber}
										</span>
									</td>
									<td className="px-4 py-3 text-gray-400">{t.propertyName}</td>
									<td className="px-4 py-3 text-gray-400">
										{formatDate(t.moveInDate)}
									</td>
									<td className="px-4 py-3">
										{t.status === "active" ? (
											<Badge className="bg-green-900/60 text-green-400 border border-green-800 hover:bg-green-900/60">
												Active
											</Badge>
										) : (
											<Badge className="bg-zinc-800 text-gray-400 border border-zinc-700 hover:bg-zinc-800">
												Inactive
											</Badge>
										)}
									</td>
									<td className="px-4 py-3">
										<div className="flex justify-end gap-1">
											<Button
												variant="ghost"
												size="sm"
												className="text-gray-400 hover:text-white hover:bg-zinc-700"
												asChild
											>
												<Link
													to="/dashboard/tenants/$tenantId"
													params={{ tenantId: t.id }}
												>
													View
												</Link>
											</Button>
											<EditTenantDialog tenant={t} />

											{t.status === "active" && <MoveOutDialog tenant={t} />}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<CreateTenantDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
		</div>
	);
}
