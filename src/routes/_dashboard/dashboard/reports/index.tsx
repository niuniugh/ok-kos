import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getOwnerPropertiesFn } from "@/modules/dashboard/serverFn";
import { getReportSummaryFn } from "@/modules/reports/serverFn";

export const Route = createFileRoute("/_dashboard/dashboard/reports/")({
	component: ReportsPage,
});

function formatRp(amount: number) {
	return `Rp ${amount.toLocaleString("id-ID")}`;
}

function currentMonth() {
	return new Date().toISOString().slice(0, 7);
}

function getLast12Months() {
	const months: { value: string; label: string }[] = [];
	const now = new Date();
	for (let i = 0; i < 12; i++) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		const label = d.toLocaleString("default", {
			month: "long",
			year: "numeric",
		});
		months.push({ value, label });
	}
	return months;
}

function exportCSV(
	breakdown: {
		tenantName: string;
		roomNumber: string;
		amountDue: number;
		amountPaid: number;
		outstanding: number;
		status: string;
	}[],
	property: string,
	month: string,
) {
	const header = "Tenant,Room,Amount Due,Amount Paid,Outstanding,Status";
	const rows = breakdown.map(
		(r) =>
			`${r.tenantName},${r.roomNumber},${r.amountDue},${r.amountPaid},${r.outstanding},${r.status}`,
	);
	const csv = [header, ...rows].join("\n");
	const blob = new Blob([csv], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `report-${property}-${month}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}

function ReportsPage() {
	const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
	const [month, setMonth] = useState(currentMonth);
	const months = getLast12Months();

	const { data: properties, isLoading: propertiesLoading } = useQuery({
		queryKey: ["owner-properties"],
		queryFn: () => getOwnerPropertiesFn(),
	});

	const { data: report, isLoading: reportLoading } = useQuery({
		queryKey: ["report-summary", propertyId, month],
		queryFn: () =>
			getReportSummaryFn({ data: { propertyId: propertyId ?? "", month } }),
		enabled: !!propertyId,
	});

	const isLoading = propertiesLoading || (!!propertyId && reportLoading);

	const statCards = [
		{
			label: "Total Due",
			value: formatRp(report?.stats.totalDue ?? 0),
		},
		{
			label: "Total Collected",
			value: formatRp(report?.stats.totalCollected ?? 0),
		},
		{
			label: "Total Outstanding",
			value: formatRp(report?.stats.totalOutstanding ?? 0),
		},
		{
			label: "Occupancy Rate",
			value: `${report?.stats.occupancyRate ?? 0}%`,
		},
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-bold text-white">Reports</h1>

				<div className="flex items-center gap-3">
					{/* Property selector */}
					{propertiesLoading ? (
						<Skeleton className="h-9 w-40" />
					) : (
						<Select value={propertyId ?? ""} onValueChange={setPropertyId}>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Select property" />
							</SelectTrigger>
							<SelectContent>
								{properties?.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}

					{/* Month picker */}
					<Select value={month} onValueChange={setMonth}>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{months.map((m) => (
								<SelectItem key={m.value} value={m.value}>
									{m.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Empty state when no property selected */}
			{!propertyId && !propertiesLoading && (
				<EmptyState
					icon={FileText}
					title="Select a property"
					description="Choose a property and month to view the report."
				/>
			)}

			{propertyId && (
				<>
					{/* Stat cards */}
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						{statCards.map(({ label, value }) => (
							<Card key={label}>
								<CardHeader>
									<CardTitle className="text-sm text-gray-400">
										{label}
									</CardTitle>
								</CardHeader>
								<CardContent>
									{isLoading ? (
										<Skeleton className="h-8 w-16" />
									) : (
										<p className="text-2xl font-semibold text-white">{value}</p>
									)}
								</CardContent>
							</Card>
						))}
					</div>

					{/* Payment breakdown table */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-sm text-gray-400">
								Payment Breakdown
							</CardTitle>
							{report && report.breakdown.length > 0 && (
								<Button
									size="sm"
									variant="outline"
									onClick={() =>
										exportCSV(
											report.breakdown,
											report.property.name,
											report.month,
										)
									}
								>
									Export CSV
								</Button>
							)}
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<Skeleton className="h-40 w-full" />
							) : !report?.breakdown.length ? (
								<p className="py-4 text-center text-sm text-gray-500">
									No payment data for this period.
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Tenant</TableHead>
											<TableHead>Room</TableHead>
											<TableHead>Amount Due</TableHead>
											<TableHead>Amount Paid</TableHead>
											<TableHead>Outstanding</TableHead>
											<TableHead>Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{report.breakdown.map((r) => (
											<TableRow key={r.paymentId}>
												<TableCell>{r.tenantName}</TableCell>
												<TableCell>{r.roomNumber}</TableCell>
												<TableCell>{formatRp(r.amountDue)}</TableCell>
												<TableCell>{formatRp(r.amountPaid)}</TableCell>
												<TableCell>{formatRp(r.outstanding)}</TableCell>
												<TableCell>
													<Badge
														variant={
															r.status === "paid"
																? "default"
																: r.status === "partial"
																	? "secondary"
																	: "destructive"
														}
													>
														{r.status}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
									<TableFooter>
										<TableRow>
											<TableCell colSpan={2} className="font-semibold">
												Total
											</TableCell>
											<TableCell className="font-semibold">
												{formatRp(report.stats.totalDue)}
											</TableCell>
											<TableCell className="font-semibold">
												{formatRp(report.stats.totalCollected)}
											</TableCell>
											<TableCell className="font-semibold">
												{formatRp(report.stats.totalOutstanding)}
											</TableCell>
											<TableCell />
										</TableRow>
									</TableFooter>
								</Table>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
