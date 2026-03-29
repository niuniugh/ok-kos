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
		return (
			<div className="text-muted-foreground text-sm py-10">
				Loading tenant...
			</div>
		);
	}

	if (!tenant) {
		return (
			<div className="py-10">
				<p className="text-destructive text-sm">Tenant not found.</p>
			</div>
		);
	}

	return (
		<div className="space-y-8 max-w">
			{/* Back */}
			<Button
				variant="ghost"
				size="sm"
				className="text-muted-foreground hover:text-foreground hover:bg-accent -ml-2"
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
					<h1 className="text-2xl font-bold">{tenant.name}</h1>
					<p className="text-muted-foreground text-sm mt-0.5">
						Tenant since {formatDate(tenant.moveInDate, "long")}
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{tenant.status === "active" ? (
						<Badge variant="success">Active</Badge>
					) : (
						<Badge variant="secondary">Inactive</Badge>
					)}

					{tenant.status === "active" && (
						<>
							<EditTenantDialog tenant={tenant} />
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
				<h2 className="text-lg font-semibold mb-4">Payment History</h2>
				<PaymentHistory tenantId={tenantId} />
			</div>
		</div>
	);
}

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
		<div className="bg-card border border-border rounded-lg px-4 py-3 space-y-1">
			<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
				<Icon className="w-3 h-3" />
				{label}
			</div>
			<p className="text-sm font-medium">{value}</p>
		</div>
	);
}
