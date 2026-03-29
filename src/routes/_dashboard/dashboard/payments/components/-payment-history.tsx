import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatIDR } from "@/lib/utils";
import { getPaymentsFn } from "@/modules/payment/serverFn";

interface PaymentHistoryProps {
	tenantId: string;
}

export function PaymentHistory({ tenantId }: PaymentHistoryProps) {
	const { data: res, isLoading } = useQuery({
		queryKey: ["payments", { tenantId }],
		queryFn: () => getPaymentsFn({ data: { tenantId, limit: 100 } }),
		enabled: !!tenantId,
	});
	const payments = res?.data ?? [];

	if (isLoading) {
		return <p className="text-sm text-muted-foreground">Loading payments...</p>;
	}

	if (payments.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No payment records yet for this tenant.
			</p>
		);
	}

	return (
		<div className="border border-border rounded-lg overflow-hidden">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border bg-muted/50">
						<th className="text-left px-4 py-3 text-muted-foreground font-medium">
							Month
						</th>
						<th className="text-right px-4 py-3 text-muted-foreground font-medium">
							Amount Due
						</th>
						<th className="text-right px-4 py-3 text-muted-foreground font-medium">
							Amount Paid
						</th>
						<th className="text-left px-4 py-3 text-muted-foreground font-medium">
							Status
						</th>
						<th className="text-left px-4 py-3 text-muted-foreground font-medium">
							Paid Date
						</th>
					</tr>
				</thead>
				<tbody>
					{payments.map((p, i) => (
						<tr
							key={p.id}
							className={[
								"border-b border-border last:border-0",
								i % 2 === 0 ? "bg-card" : "bg-muted/30",
							].join(" ")}
						>
							<td className="px-4 py-3 font-medium">{p.month}</td>
							<td className="px-4 py-3 text-muted-foreground text-right">
								{formatIDR(p.amountDue)}
							</td>
							<td className="px-4 py-3 text-muted-foreground text-right">
								{formatIDR(p.amountPaid)}
							</td>
							<td className="px-4 py-3">
								<StatusBadge
									status={p.status as "paid" | "partial" | "unpaid"}
								/>
							</td>
							<td className="px-4 py-3 text-muted-foreground">
								{formatDate(p.paidAt)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
