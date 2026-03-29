import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Check,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	Pencil,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { parseServerError } from "@/lib/utils";
import {
	createPaymentFn,
	getMonthlyPaymentSummaryFn,
} from "@/modules/payment/serverFn";
import {
	type EditablePayment,
	EditPaymentDialog,
} from "./components/-edit-payment";
import {
	currentMonth,
	formatIDR,
	formatMonth,
	shiftMonth,
} from "./utils/-utils";

export const Route = createFileRoute("/_dashboard/dashboard/payments/")({
	component: PaymentsPage,
});

function PaymentsPage() {
	const queryClient = useQueryClient();
	const [month, setMonth] = useState(currentMonth);
	const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [editPayment, setEditPayment] = useState<EditablePayment | null>(null);
	const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

	const { data, isLoading } = useQuery({
		queryKey: ["monthly-payments", month, propertyId],
		queryFn: () => getMonthlyPaymentSummaryFn({ data: { month, propertyId } }),
	});

	const markPaidMutation = useMutation({
		mutationFn: (tenant: { tenantId: string; amountDue: number }) =>
			createPaymentFn({
				data: {
					tenantId: tenant.tenantId,
					month,
					amountDue: tenant.amountDue,
					amountPaid: tenant.amountDue,
					status: "paid",
				},
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["monthly-payments"] });
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			toast.success("Payment marked as paid");
			setMarkingPaidId(null);
		},
		onError: (err) => {
			toast.error(parseServerError(err));
			setMarkingPaidId(null);
		},
	});

	const summary = data?.summary;
	const properties = data?.properties ?? [];

	const filteredTenants = (data?.tenants ?? []).filter((t) => {
		if (search && !t.tenantName.toLowerCase().includes(search.toLowerCase()))
			return false;
		if (
			statusFilter === "unpaid" &&
			t.status !== "unpaid" &&
			t.status !== "no_record"
		)
			return false;
		if (
			statusFilter !== "all" &&
			statusFilter !== "unpaid" &&
			t.status !== statusFilter
		)
			return false;
		return true;
	});

	const statCards = [
		{
			label: "Total Tenants",
			value: summary?.totalTenants ?? 0,
			color: "text-foreground",
		},
		{
			label: "Paid",
			value: summary?.paidCount ?? 0,
			color: "text-success",
		},
		{
			label: "Unpaid",
			value: summary?.unpaidCount ?? 0,
			color: "text-destructive",
		},
		{
			label: "Collected",
			value: `${formatIDR(summary?.totalCollected ?? 0)} / ${formatIDR(summary?.totalDue ?? 0)}`,
			color: "text-foreground",
		},
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold">Payments</h1>
					<p className="text-muted-foreground">
						Manage monthly rent collection
					</p>
				</div>

				<div className="flex items-center gap-3">
					{/* Property selector */}
					{properties.length > 1 && (
						<Select
							value={propertyId ?? "all"}
							onValueChange={(v) => setPropertyId(v === "all" ? undefined : v)}
						>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="All Properties" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Properties</SelectItem>
								{properties.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}

					{/* Month navigator */}
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => setMonth((m) => shiftMonth(m, -1))}
							className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<span className="w-32 text-center text-sm text-muted-foreground">
							{formatMonth(month)}
						</span>
						<button
							type="button"
							onClick={() => setMonth((m) => shiftMonth(m, 1))}
							className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Summary cards */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{statCards.map(({ label, value, color }) => (
					<Card key={label}>
						<CardHeader>
							<CardTitle className="text-sm text-muted-foreground">
								{label}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<Skeleton className="h-8 w-20" />
							) : (
								<p className={`text-2xl font-semibold ${color}`}>{value}</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Filters */}
			<div className="flex gap-3 flex-wrap items-center">
				<Input
					placeholder="Search tenant..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-48"
				/>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-36">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						<SelectItem value="paid">Paid</SelectItem>
						<SelectItem value="partial">Partial</SelectItem>
						<SelectItem value="unpaid">Unpaid</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Tenant list */}
			{isLoading ? (
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-20 w-full" />
					))}
				</div>
			) : filteredTenants.length === 0 ? (
				<EmptyState
					icon={CreditCard}
					title="No tenants found"
					description={
						data?.tenants.length === 0
							? "Add tenants to start tracking payments."
							: "No tenants match your filters."
					}
				/>
			) : (
				<div className="space-y-3">
					{filteredTenants.map((t) => {
						const isPaid = t.status === "paid";
						const isMarking = markingPaidId === t.tenantId;

						return (
							<div
								key={t.tenantId}
								className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								{/* Left: tenant info */}
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="font-medium truncate">{t.tenantName}</span>
										<StatusBadge
											status={
												t.status === "no_record"
													? "unpaid"
													: (t.status as "paid" | "partial" | "unpaid")
											}
										/>
									</div>
									<p className="text-sm text-muted-foreground mt-0.5">
										Room {t.roomNumber} · {t.propertyName}
									</p>
								</div>

								{/* Middle: amounts */}
								<div className="flex items-center gap-6 text-sm">
									<div>
										<p className="text-muted-foreground text-xs">Due</p>
										<p className="font-medium">{formatIDR(t.amountDue)}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Paid</p>
										<p
											className={
												isPaid ? "text-success font-medium" : "font-medium"
											}
										>
											{formatIDR(t.amountPaid)}
										</p>
									</div>
									{!isPaid && t.amountDue - t.amountPaid > 0 && (
										<div>
											<p className="text-muted-foreground text-xs">
												Outstanding
											</p>
											<p className="text-destructive font-medium">
												{formatIDR(t.amountDue - t.amountPaid)}
											</p>
										</div>
									)}
								</div>

								{/* Right: actions */}
								<div className="flex items-center gap-2 shrink-0">
									{!isPaid && (
										<Button
											size="sm"
											className="bg-success hover:bg-success/90 text-success-foreground"
											disabled={isMarking}
											onClick={() => {
												setMarkingPaidId(t.tenantId);
												markPaidMutation.mutate({
													tenantId: t.tenantId,
													amountDue: t.amountDue,
												});
											}}
										>
											<Check className="h-3.5 w-3.5 mr-1" />
											{isMarking ? "Saving..." : "Mark Paid"}
										</Button>
									)}
									<Button
										variant="ghost"
										size="sm"
										className="text-muted-foreground hover:text-foreground hover:bg-accent"
										onClick={() =>
											setEditPayment({
												id: t.paymentId ?? "",
												tenantId: t.tenantId,
												amountDue: t.amountDue,
												amountPaid: t.amountPaid,
												status: (t.status === "no_record"
													? "unpaid"
													: t.status) as EditablePayment["status"],
												tenantName: t.tenantName,
												month,
												mode: t.paymentId ? "edit" : "create",
											})
										}
									>
										<Pencil className="h-3.5 w-3.5 mr-1" />
										Edit
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{editPayment && (
				<EditPaymentDialog
					payment={editPayment}
					open={!!editPayment}
					onOpenChange={(o) => {
						if (!o) setEditPayment(null);
					}}
				/>
			)}
		</div>
	);
}
