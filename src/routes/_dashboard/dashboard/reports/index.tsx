import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
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
import { currentMonth, formatIDR } from "@/lib/utils";
import {
	getReportAnalyticsFn,
	getReportSummaryFn,
} from "@/modules/reports/serverFn";

export const Route = createFileRoute("/_dashboard/dashboard/reports/")({
	component: ReportsPage,
});

function formatMonthShort(month: string) {
	const [y, m] = month.split("-").map(Number);
	const now = new Date();
	const d = new Date(y, m - 1);
	const short = d.toLocaleString("default", { month: "short" });
	return y !== now.getFullYear() ? `${short} '${String(y).slice(2)}` : short;
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

const incomeChartConfig = {
	totalCollected: { label: "Collected", color: "#22c55e" },
	totalOutstanding: { label: "Outstanding", color: "#ef4444" },
};

const rateChartConfig = {
	collectionRate: { label: "Collection Rate", color: "#3b82f6" },
};

function ReportsPage() {
	const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
	const [breakdownMonth, setBreakdownMonth] = useState(currentMonth);
	const selectMonths = getLast12Months();

	const { data: analytics, isLoading: analyticsLoading } = useQuery({
		queryKey: ["report-analytics", propertyId],
		queryFn: () => getReportAnalyticsFn({ data: { propertyId } }),
	});

	const { data: report, isLoading: reportLoading } = useQuery({
		queryKey: ["report-summary", propertyId, breakdownMonth],
		queryFn: () =>
			getReportSummaryFn({
				data: { propertyId: propertyId ?? "", month: breakdownMonth },
			}),
		enabled: !!propertyId,
	});

	const properties = analytics?.properties ?? [];
	const overall = analytics?.overall;

	const chartData = (analytics?.months ?? []).map((m) => ({
		name: formatMonthShort(m.month),
		totalCollected: m.totalCollected,
		totalOutstanding: m.totalOutstanding,
		collectionRate: m.collectionRate,
	}));

	const statCards = [
		{
			label: "Total Income (12mo)",
			value: formatIDR(overall?.totalIncome ?? 0),
			color: "text-white",
		},
		{
			label: "Total Collected",
			value: formatIDR(overall?.totalCollected ?? 0),
			color: "text-green-400",
		},
		{
			label: "Avg Collection Rate",
			value: `${overall?.avgCollectionRate ?? 0}%`,
			color:
				(overall?.avgCollectionRate ?? 0) >= 80
					? "text-green-400"
					: "text-yellow-400",
		},
		{
			label: "Occupancy Rate",
			value: `${overall?.occupancyRate ?? 0}%`,
			color:
				(overall?.occupancyRate ?? 0) >= 80
					? "text-green-400"
					: "text-yellow-400",
		},
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-white">Reports</h1>
					<p className="text-gray-400">12-month analytics overview</p>
				</div>

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
			</div>

			{/* Summary cards */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{statCards.map(({ label, value, color }) => (
					<Card key={label}>
						<CardHeader>
							<CardTitle className="text-sm text-gray-400">{label}</CardTitle>
						</CardHeader>
						<CardContent>
							{analyticsLoading ? (
								<Skeleton className="h-8 w-20" />
							) : (
								<p className={`text-2xl font-semibold ${color}`}>{value}</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Collection Rate Chart */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm text-gray-400">
						Collection Rate Trend
					</CardTitle>
				</CardHeader>
				<CardContent>
					{analyticsLoading ? (
						<Skeleton className="h-48 w-full" />
					) : (
						<ChartContainer config={rateChartConfig} className="h-48 w-full">
							<AreaChart data={chartData}>
								<defs>
									<linearGradient
										id="collectionGradient"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="name" tickLine={false} axisLine={false} />
								<YAxis
									tickFormatter={(v) => `${v}%`}
									domain={[0, 100]}
									tickLine={false}
									axisLine={false}
									width={45}
								/>
								<ChartTooltip
									content={
										<ChartTooltipContent formatter={(value) => `${value}%`} />
									}
								/>
								<Area
									type="monotone"
									dataKey="collectionRate"
									stroke="#3b82f6"
									fill="url(#collectionGradient)"
									strokeWidth={2}
								/>
							</AreaChart>
						</ChartContainer>
					)}
				</CardContent>
			</Card>

			{/* Monthly Income Chart */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm text-gray-400">
						Monthly Income
					</CardTitle>
				</CardHeader>
				<CardContent>
					{analyticsLoading ? (
						<Skeleton className="h-48 w-full" />
					) : (
						<ChartContainer config={incomeChartConfig} className="h-48 w-full">
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="name" tickLine={false} axisLine={false} />
								<YAxis
									tickFormatter={(v) => formatIDR(v)}
									width={90}
									tickLine={false}
									axisLine={false}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<ChartLegend content={<ChartLegendContent />} />
								<Bar
									dataKey="totalCollected"
									stackId="income"
									fill="#22c55e"
									radius={[0, 0, 0, 0]}
								/>
								<Bar
									dataKey="totalOutstanding"
									stackId="income"
									fill="#ef4444"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ChartContainer>
					)}
				</CardContent>
			</Card>

			{/* Monthly Breakdown Table */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-sm text-gray-400">
						Monthly Breakdown
					</CardTitle>
					<div className="flex items-center gap-2">
						{/* Property selector for breakdown (if not already filtered) */}
						{!propertyId && properties.length > 0 && (
							<p className="text-xs text-gray-500">
								Select a property to view breakdown
							</p>
						)}

						{propertyId && (
							<>
								<Select
									value={breakdownMonth}
									onValueChange={setBreakdownMonth}
								>
									<SelectTrigger className="w-40 h-8 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{selectMonths.map((m) => (
											<SelectItem key={m.value} value={m.value}>
												{m.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{report && report.breakdown.length > 0 && (
									<Button
										size="sm"
										variant="outline"
										className="h-8"
										onClick={() =>
											exportCSV(
												report.breakdown,
												report.property.name,
												report.month,
											)
										}
									>
										<Download className="h-3.5 w-3.5 mr-1" />
										CSV
									</Button>
								)}
							</>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{!propertyId ? (
						<p className="py-4 text-center text-sm text-gray-500">
							Select a property above to view the detailed breakdown.
						</p>
					) : reportLoading ? (
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
									<TableHead className="text-right">Amount Due</TableHead>
									<TableHead className="text-right">Amount Paid</TableHead>
									<TableHead className="text-right">Outstanding</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{report.breakdown.map((r) => (
									<TableRow key={r.paymentId}>
										<TableCell className="font-medium">
											{r.tenantName}
										</TableCell>
										<TableCell>{r.roomNumber}</TableCell>
										<TableCell className="text-right">
											{formatIDR(r.amountDue)}
										</TableCell>
										<TableCell className="text-right">
											{formatIDR(r.amountPaid)}
										</TableCell>
										<TableCell className="text-right">
											{formatIDR(r.outstanding)}
										</TableCell>
										<TableCell>
											<StatusBadge status={r.status} />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
							<TableFooter>
								<TableRow>
									<TableCell colSpan={2} className="font-semibold">
										Total
									</TableCell>
									<TableCell className="text-right font-semibold">
										{formatIDR(report.stats.totalDue)}
									</TableCell>
									<TableCell className="text-right font-semibold">
										{formatIDR(report.stats.totalCollected)}
									</TableCell>
									<TableCell className="text-right font-semibold">
										{formatIDR(report.stats.totalOutstanding)}
									</TableCell>
									<TableCell />
								</TableRow>
							</TableFooter>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	if (status === "paid") {
		return (
			<Badge className="bg-green-900/60 text-green-400 border border-green-800 hover:bg-green-900/60">
				Paid
			</Badge>
		);
	}
	if (status === "partial") {
		return (
			<Badge className="bg-yellow-900/60 text-yellow-400 border border-yellow-800 hover:bg-yellow-900/60">
				Partial
			</Badge>
		);
	}
	return (
		<Badge className="bg-red-900/60 text-red-400 border border-red-800 hover:bg-red-900/60">
			Unpaid
		</Badge>
	);
}
