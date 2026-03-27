import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
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
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { currentMonth, formatIDR } from "@/lib/utils";
import {
	getDashboardSummaryFn,
	getIncomeTrendFn,
	getOwnerPropertiesFn,
} from "@/modules/dashboard/serverFn";

export const Route = createFileRoute("/_dashboard/dashboard/")({
	component: DashboardPage,
});

function shiftMonth(month: string, offset: number) {
	const [y, m] = month.split("-").map(Number);
	const d = new Date(y, m - 1 + offset, 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string) {
	const [y, m] = month.split("-").map(Number);
	return new Date(y, m - 1).toLocaleString("default", {
		month: "long",
		year: "numeric",
	});
}

function formatMonthShort(month: string, endMonth: string) {
	const [y, m] = month.split("-").map(Number);
	const [endY] = endMonth.split("-").map(Number);
	const d = new Date(y, m - 1);
	const short = d.toLocaleString("default", { month: "short" });
	return y !== endY ? `${short} '${String(y).slice(2)}` : short;
}

const chartConfig = {
	collected: { label: "Collected", color: "#22c55e" },
	outstanding: { label: "Outstanding", color: "#ef4444" },
};

function DashboardPage() {
	const [month, setMonth] = useState(currentMonth);
	const [propertyId, setPropertyId] = useState<string | undefined>(undefined);

	const { data: properties, isLoading: propertiesLoading } = useQuery({
		queryKey: ["owner-properties"],
		queryFn: () => getOwnerPropertiesFn(),
	});

	const { data: summary, isLoading: summaryLoading } = useQuery({
		queryKey: ["dashboard-summary", propertyId, month],
		queryFn: () => getDashboardSummaryFn({ data: { propertyId, month } }),
		enabled: !propertiesLoading,
	});

	const { data: trendData, isLoading: trendLoading } = useQuery({
		queryKey: ["income-trend", propertyId, month],
		queryFn: () => getIncomeTrendFn({ data: { propertyId, month } }),
		enabled: !propertiesLoading,
	});

	const isLoading = propertiesLoading || summaryLoading;
	const chartLoading = propertiesLoading || trendLoading;

	if (!isLoading && summary && !summary.hasProperties) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-bold text-white">
					Hello, {summary.owner.name}!
				</h1>
				<EmptyState
					icon={Building2}
					title="No properties yet"
					description="Add your first property to start tracking rooms, tenants, and payments."
					actionLabel="Go to Properties"
					actionHref="/dashboard/properties"
				/>
			</div>
		);
	}

	const chartData = (trendData ?? []).map((item) => ({
		name: formatMonthShort(item.month, month),
		collected: item.collected,
		outstanding: item.outstanding,
	}));

	const statCards = [
		{ label: "Total Rooms", value: summary?.stats.totalRooms ?? 0 },
		{ label: "Occupied", value: summary?.stats.occupied ?? 0 },
		{ label: "Vacant", value: summary?.stats.vacant ?? 0 },
		{
			label: "Monthly Income",
			value: `Rp ${(summary?.stats.monthlyIncome ?? 0).toLocaleString("id-ID")}`,
		},
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					{isLoading ? (
						<Skeleton className="h-8 w-48" />
					) : (
						<h1 className="text-2xl font-bold text-white">
							Hello, {summary?.owner.name}!
						</h1>
					)}
				</div>

				<div className="flex items-center gap-3">
					{/* Property selector */}
					{propertiesLoading ? (
						<Skeleton className="h-9 w-40" />
					) : properties && properties.length > 1 ? (
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
					) : null}

					{/* Month navigator */}
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => setMonth((m) => shiftMonth(m, -1))}
							className="rounded p-1 text-gray-400 transition hover:bg-zinc-800 hover:text-white"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<span className="w-32 text-center text-sm text-gray-300">
							{formatMonth(month)}
						</span>
						<button
							type="button"
							onClick={() => setMonth((m) => shiftMonth(m, 1))}
							className="rounded p-1 text-gray-400 transition hover:bg-zinc-800 hover:text-white"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Stat cards */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{statCards.map(({ label, value }) => (
					<Card key={label}>
						<CardHeader>
							<CardTitle className="text-sm text-gray-400">{label}</CardTitle>
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

			{/* Income trend chart */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm text-gray-400">Income Trend</CardTitle>
				</CardHeader>
				<CardContent>
					{chartLoading ? (
						<Skeleton className="h-48 w-full" />
					) : (
						<ChartContainer config={chartConfig} className="h-48 w-full">
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="name" tickLine={false} axisLine={false} />
								<YAxis
									tickFormatter={(value) => formatIDR(value)}
									width={90}
									tickLine={false}
									axisLine={false}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<ChartLegend content={<ChartLegendContent />} />
								<Bar
									dataKey="collected"
									stackId="income"
									fill={chartConfig.collected.color}
									radius={[0, 0, 0, 0]}
								/>
								<Bar
									dataKey="outstanding"
									stackId="income"
									fill={chartConfig.outstanding.color}
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ChartContainer>
					)}
				</CardContent>
			</Card>

			{/* Overdue tenants table */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm text-gray-400">
						Overdue Tenants
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Skeleton className="h-24 w-full" />
					) : !summary?.overdueTenants.length ? (
						<p className="py-4 text-center text-sm text-gray-500">
							No overdue tenants this month.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Tenant</TableHead>
									<TableHead>Room</TableHead>
									<TableHead>Due</TableHead>
									<TableHead>Paid</TableHead>
									<TableHead>Outstanding</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{summary.overdueTenants.map((t) => (
									<TableRow key={t.tenantId}>
										<TableCell>{t.tenantName}</TableCell>
										<TableCell>{t.roomNumber}</TableCell>
										<TableCell>
											Rp {t.amountDue.toLocaleString("id-ID")}
										</TableCell>
										<TableCell>
											Rp {t.amountPaid.toLocaleString("id-ID")}
										</TableCell>
										<TableCell>
											Rp {t.outstanding.toLocaleString("id-ID")}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													t.status === "unpaid" ? "destructive" : "secondary"
												}
											>
												{t.status}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
