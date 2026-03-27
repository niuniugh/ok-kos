import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
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

	const formatIDR = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

	const formatDate = (d: Date | string | null) => {
		if (!d) return "—";
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString("id-ID", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	if (isLoading) {
		return <p className="text-sm text-gray-400">Loading payments...</p>;
	}

	if (payments.length === 0) {
		return (
			<p className="text-sm text-gray-400">
				No payment records yet for this tenant.
			</p>
		);
	}

	return (
		<div className="border border-zinc-800 rounded-lg overflow-hidden">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-zinc-800 bg-zinc-900/50">
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
						<th className="text-left px-4 py-3 text-gray-400 font-medium">
							Paid Date
						</th>
					</tr>
				</thead>
				<tbody>
					{payments.map((p, i) => (
						<tr
							key={p.id}
							className={[
								"border-b border-zinc-800 last:border-0",
								i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/60",
							].join(" ")}
						>
							<td className="px-4 py-3 text-white font-medium">{p.month}</td>
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
							<td className="px-4 py-3 text-gray-400">
								{formatDate(p.paidAt)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
