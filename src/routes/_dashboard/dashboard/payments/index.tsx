import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { PaymentStatus } from "generated/prisma/enums";
import { ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getPaymentsFn } from "@/modules/payment/serverFn";
import {
	type EditablePayment,
	EditPaymentDialog,
} from "./components/edit-payment";
import { LogPaymentDialog } from "./components/log-payments";
import { formatIDR } from "./utils/utils";

export const Route = createFileRoute("/_dashboard/dashboard/payments/")({
	component: PaymentsPage,
});

const PAGE_SIZE = 20;

function PaymentsPage() {
	const [monthFilter, setMonthFilter] = useState("");
	const [tenantSearch, setTenantSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [editPayment, setEditPayment] = useState<EditablePayment | null>(null);
	const [page, setPage] = useState(1);

	// Reset to page 1 on any filter change
	const handleMonthChange = (v: string) => {
		setMonthFilter(v);
		setPage(1);
	};
	const handleTenantSearch = (v: string) => {
		setTenantSearch(v);
		setPage(1);
	};
	const handleStatusChange = (v: string) => {
		setStatusFilter(v);
		setPage(1);
	};

	const { data: paymentsRes, isLoading } = useQuery({
		queryKey: ["payments", monthFilter, statusFilter, page],
		queryFn: () =>
			getPaymentsFn({
				data: {
					month: monthFilter || undefined,
					status:
						statusFilter !== "all"
							? (statusFilter as "paid" | "unpaid" | "partial")
							: undefined,
					page,
					limit: PAGE_SIZE,
				},
			}),
	});

	const allPayments = paymentsRes?.data ?? [];
	const payments = tenantSearch
		? allPayments.filter((p) =>
				p.tenantName.toLowerCase().includes(tenantSearch.toLowerCase()),
			)
		: allPayments;

	const meta = paymentsRes?.meta;
	const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;
	const from = meta ? (meta.page - 1) * meta.limit + 1 : 0;
	const to = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-white">Payments</h1>
					<p className="text-gray-400">Track monthly rent payments</p>
				</div>
				<LogPaymentDialog />
			</div>

			{/* Filters */}
			<div className="flex gap-3 flex-wrap items-end">
				<div className="space-y-1.5">
					<Label className="text-xs text-gray-500">Month</Label>
					<Input
						type="month"
						value={monthFilter}
						onChange={(e) => handleMonthChange(e.target.value)}
						className="w-44 bg-zinc-900 border-zinc-700 text-white"
					/>
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs text-gray-500">Tenant</Label>
					<Input
						placeholder="Search tenant..."
						value={tenantSearch}
						onChange={(e) => handleTenantSearch(e.target.value)}
						className="w-48 bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500"
					/>
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs text-gray-500">Status</Label>
					<Select value={statusFilter} onValueChange={handleStatusChange}>
						<SelectTrigger className="w-36 bg-zinc-900 border-zinc-700 text-white">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="bg-zinc-800 border-zinc-700">
							<SelectItem value="all" className="text-white focus:bg-zinc-700">
								All statuses
							</SelectItem>
							<SelectItem value="paid" className="text-white focus:bg-zinc-700">
								Paid
							</SelectItem>
							<SelectItem
								value="partial"
								className="text-white focus:bg-zinc-700"
							>
								Partial
							</SelectItem>
							<SelectItem
								value="unpaid"
								className="text-white focus:bg-zinc-700"
							>
								Unpaid
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="text-gray-400 text-sm py-10">Loading payments...</div>
			) : payments.length === 0 ? (
				<EmptyState
					icon={CreditCard}
					title="No payments found"
					description="Log your first payment using the button above."
				/>
			) : (
				<>
					<div className="border border-zinc-800 rounded-lg overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-zinc-800 bg-zinc-900/50">
									<th className="text-left px-4 py-3 text-gray-400 font-medium">
										Tenant
									</th>
									<th className="text-left px-4 py-3 text-gray-400 font-medium">
										Room
									</th>
									<th className="text-left px-4 py-3 text-gray-400 font-medium">
										Month
									</th>
									<th className="text-right px-4 py-3 text-gray-400 font-medium">
										Amount Due
									</th>
									<th className="text-right px-4 py-3 text-gray-400 font-medium">
										Amount Paid
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
								{payments.map((p, i) => (
									<tr
										key={p.id}
										className={[
											"border-b border-zinc-800 last:border-0 transition-colors hover:bg-zinc-800/40",
											i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/60",
										].join(" ")}
									>
										<td className="px-4 py-3 text-white font-medium">
											{p.tenantName}
										</td>
										<td className="px-4 py-3 text-gray-300">{p.roomNumber}</td>
										<td className="px-4 py-3 text-gray-300">{p.month}</td>
										<td className="px-4 py-3 text-gray-300 text-right">
											{formatIDR(p.amountDue)}
										</td>
										<td className="px-4 py-3 text-gray-300 text-right">
											{formatIDR(p.amountPaid)}
										</td>
										<td className="px-4 py-3">
											{p.status === "paid" ? (
												<Badge className="bg-green-900/60 text-green-400 border border-green-800 hover:bg-green-900/60">
													Paid
												</Badge>
											) : p.status === "partial" ? (
												<Badge className="bg-yellow-900/60 text-yellow-400 border border-yellow-800 hover:bg-yellow-900/60">
													Partial
												</Badge>
											) : (
												<Badge className="bg-red-900/60 text-red-400 border border-red-800 hover:bg-red-900/60">
													Unpaid
												</Badge>
											)}
										</td>
										<td className="px-4 py-3 text-right">
											<Button
												variant="ghost"
												size="sm"
												className="text-gray-400 hover:text-white hover:bg-zinc-700"
												onClick={() =>
													setEditPayment({
														id: p.id,
														amountDue: p.amountDue,
														amountPaid: p.amountPaid,
														status: p.status as PaymentStatus,
														tenantName: p.tenantName,
														month: p.month,
													})
												}
											>
												Edit
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{editPayment && (
						<EditPaymentDialog
							payment={editPayment}
							open={!!editPayment}
							onOpenChange={(o) => {
								if (!o) setEditPayment(null);
							}}
						/>
					)}

					{/* Pagination — only shown when there's more than one page */}
					{meta && meta.total > PAGE_SIZE && (
						<div className="flex items-center justify-between text-sm">
							<p className="text-gray-400">
								Showing{" "}
								<span className="text-white font-medium">
									{from}–{to}
								</span>{" "}
								of <span className="text-white font-medium">{meta.total}</span>{" "}
								payments
							</p>

							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									className="text-gray-400 hover:text-white hover:bg-zinc-800 gap-1"
									onClick={() => setPage((p) => p - 1)}
									disabled={page <= 1}
								>
									<ChevronLeft className="w-4 h-4" />
									Prev
								</Button>

								<span className="text-gray-400 tabular-nums">
									{page} / {totalPages}
								</span>

								<Button
									variant="ghost"
									size="sm"
									className="text-gray-400 hover:text-white hover:bg-zinc-800 gap-1"
									onClick={() => setPage((p) => p + 1)}
									disabled={page >= totalPages}
								>
									Next
									<ChevronRight className="w-4 h-4" />
								</Button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
