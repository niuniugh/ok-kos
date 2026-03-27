import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Building2,
	CalendarDays,
	CalendarX,
	ChevronLeft,
	Home,
	Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getTenantFn } from "@/modules/tenant/serverFn";
import { PaymentHistory } from "../../payments/components/-payment-history";
import { EditTenantDialog } from "../components/-edit-tenant";
import { MoveOutDialog } from "../components/-move-out-dialog";

export const Route = createFileRoute(
	"/_dashboard/dashboard/tenants/$tenantId/",
)({
	component: TenantDetailPage,
});

function TenantDetailPage() {
	const { tenantId } = Route.useParams();

	const { data, isLoading } = useQuery({
		queryKey: ["tenant", tenantId],
		queryFn: () => getTenantFn({ data: { id: tenantId } }),
	});
	const tenant = data?.tenant;

	if (isLoading) {
		return <div className="text-gray-400 text-sm py-10">Loading tenant...</div>;
	}

	if (!tenant) {
		return (
			<div className="py-10">
				<p className="text-red-400 text-sm">Tenant not found.</p>
			</div>
		);
	}

	return (
		<div className="space-y-8 max-w">
			{/* Back */}
			<Button
				variant="ghost"
				size="sm"
				className="text-gray-400 hover:text-white hover:bg-zinc-800 -ml-2"
				asChild
			>
				<Link to="/dashboard/tenants">
					<ChevronLeft className="w-4 h-4 mr-1" />
					Back to Tenants
				</Link>
			</Button>

			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
					<p className="text-gray-400 text-sm mt-0.5">
						Tenant since {formatDate(tenant.moveInDate, "long")}
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{tenant.status === "active" ? (
						<Badge className="bg-green-900/60 text-green-400 border border-green-800 hover:bg-green-900/60">
							Active
						</Badge>
					) : (
						<Badge className="bg-zinc-800 text-gray-400 border border-zinc-700 hover:bg-zinc-800">
							Inactive
						</Badge>
					)}

					{tenant.status === "active" && (
						<>
							{/* Edit button */}
							<EditTenantDialog tenant={tenant} />

							{/* Move Out */}
							<MoveOutDialog
								tenant={{ ...tenant, roomNumber: tenant.room.roomNumber }}
							/>
						</>
					)}
				</div>
			</div>

			{/* Info cards */}
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				<InfoCard icon={Phone} label="Phone" value={tenant.phone} />
				<InfoCard
					icon={Home}
					label="Room"
					value={`Room ${tenant.room.roomNumber}`}
				/>
				<InfoCard
					icon={Building2}
					label="Property"
					value={tenant.room.property.name}
				/>
				<InfoCard
					icon={CalendarDays}
					label="Move-in Date"
					value={formatDate(tenant.moveInDate, "long")}
				/>
				<InfoCard
					icon={CalendarX}
					label="Move-out Date"
					value={formatDate(tenant.moveOutDate, "long")}
				/>
				<InfoCard
					icon={Home}
					label="Monthly Rent"
					value={`Rp ${tenant.room.rentPrice.toLocaleString("id-ID")}`}
				/>
			</div>

			{/* Payment history */}
			<div>
				<h2 className="text-lg font-semibold text-white mb-4">
					Payment History
				</h2>
				<PaymentHistory tenantId={tenantId} />
			</div>
		</div>
	);
}

// ── InfoCard ──────────────────────────────────────────────────────────────

function InfoCard({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType;
	label: string;
	value: string;
}) {
	return (
		<div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 space-y-1">
			<div className="flex items-center gap-1.5 text-gray-500 text-xs">
				<Icon className="w-3 h-3" />
				{label}
			</div>
			<p className="text-white text-sm font-medium">{value}</p>
		</div>
	);
}
