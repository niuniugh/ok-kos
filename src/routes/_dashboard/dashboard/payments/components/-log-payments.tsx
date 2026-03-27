import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { parseServerError } from "@/lib/utils";
import { createPaymentFn } from "@/modules/payment/serverFn";
import { getTenantsFn } from "@/modules/tenant/serverFn";
import { currentMonth, deriveStatus, formatIDR } from "../utils/-utils";

export function LogPaymentDialog() {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [error, setError] = useState("");
	const [tenantId, setTenantId] = useState("");
	const [amountDue, setAmountDue] = useState(0);
	const [amountPaid, setAmountPaid] = useState(0);

	const { data: tenantsRes } = useQuery({
		queryKey: ["tenants", "active"],
		queryFn: () => getTenantsFn({ data: { status: "active" } }),
		enabled: open,
	});
	const activeTenants = tenantsRes?.data ?? [];

	const mutation = useMutation({
		mutationFn: (payload: {
			tenantId: string;
			month: string;
			amountDue: number;
			amountPaid: number;
		}) =>
			createPaymentFn({
				data: {
					...payload,
					status: deriveStatus(payload.amountDue, payload.amountPaid),
				},
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			toast.success("Payment logged");
			handleClose();
		},
		onError: (err) => setError(parseServerError(err)),
	});

	const handleClose = () => {
		setOpen(false);
		setTenantId("");
		setAmountDue(0);
		setAmountPaid(0);
		setError("");
	};

	const handleTenantChange = (id: string) => {
		const tenant = activeTenants.find((t) => t.id === id);
		setTenantId(id);
		setAmountDue(tenant?.rentPrice ?? 0);
		setAmountPaid(0);
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (!tenantId) {
			setError("Please select a tenant.");
			return;
		}

		const fd = new FormData(e.currentTarget);
		const month = fd.get("month") as string;
		const due = Number(fd.get("amountDue"));
		const paid = Number(fd.get("amountPaid"));

		if (paid > due) {
			setError(
				`Amount paid (${formatIDR(paid)}) cannot exceed amount due (${formatIDR(due)}). ` +
					"If the tenant overpaid, adjust the amount due instead.",
			);
			return;
		}

		mutation.mutate({ tenantId, month, amountDue: due, amountPaid: paid });
	};

	const derivedStatus = deriveStatus(amountDue, amountPaid);

	return (
		<>
			<Button
				className="bg-blue-600 hover:bg-blue-700 text-white"
				onClick={() => setOpen(true)}
			>
				<PlusIcon className="w-4 h-4 mr-2" />
				Log Payment
			</Button>

			<Dialog
				open={open}
				onOpenChange={(o) => {
					if (!o) handleClose();
				}}
			>
				<DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-white">Log Payment</DialogTitle>
						<DialogDescription>
							Record a payment for a tenant.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4 pt-1">
						{error && (
							<p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
								{error}
							</p>
						)}

						<div className="space-y-1.5">
							<Label className="text-gray-300">Tenant</Label>
							<Select value={tenantId} onValueChange={handleTenantChange}>
								<SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
									<SelectValue placeholder="Select tenant" />
								</SelectTrigger>
								<SelectContent className="bg-zinc-800 border-zinc-700">
									{activeTenants.map((t) => (
										<SelectItem
											key={t.id}
											value={t.id}
											className="text-white focus:bg-zinc-700"
										>
											{t.name} — Room {t.roomNumber}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="log-month" className="text-gray-300">
								Month
							</Label>
							<Input
								id="log-month"
								name="month"
								type="month"
								required
								defaultValue={currentMonth()}
								className="bg-zinc-800 border-zinc-700 text-white"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="log-amountDue" className="text-gray-300">
								Amount Due (IDR)
							</Label>
							<Input
								id="log-amountDue"
								name="amountDue"
								type="number"
								min={1}
								required
								value={amountDue || ""}
								onChange={(e) => {
									const newDue = Number(e.target.value);
									setAmountDue(newDue);
									if (amountPaid > newDue) setAmountPaid(newDue);
								}}
								placeholder="e.g. 1500000"
								className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="log-amountPaid" className="text-gray-300">
								Amount Paid (IDR)
							</Label>
							<Input
								id="log-amountPaid"
								name="amountPaid"
								type="number"
								min={0}
								max={amountDue || undefined}
								required
								value={amountPaid || ""}
								onChange={(e) => setAmountPaid(Number(e.target.value))}
								placeholder="e.g. 1500000"
								className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
							/>
							{amountDue > 0 && (
								<p className="text-xs text-gray-500">
									Max: {formatIDR(amountDue)}
								</p>
							)}
						</div>

						{amountDue > 0 && (
							<div className="space-y-1.5">
								<Label className="text-gray-300">Status</Label>
								<div className="flex items-center gap-3 py-1">
									{derivedStatus === "paid" ? (
										<Badge className="bg-green-900/60 text-green-400 border border-green-800 hover:bg-green-900/60">
											Paid
										</Badge>
									) : derivedStatus === "partial" ? (
										<Badge className="bg-yellow-900/60 text-yellow-400 border border-yellow-800 hover:bg-yellow-900/60">
											Partial
										</Badge>
									) : (
										<Badge className="bg-red-900/60 text-red-400 border border-red-800 hover:bg-red-900/60">
											Unpaid
										</Badge>
									)}
									{derivedStatus === "partial" && (
										<span className="text-xs text-gray-400">
											Outstanding: {formatIDR(amountDue - amountPaid)}
										</span>
									)}
								</div>
							</div>
						)}

						<Button
							type="submit"
							className="w-full bg-blue-600 hover:bg-blue-700 text-white"
							disabled={mutation.isPending || !tenantId || amountDue <= 0}
						>
							{mutation.isPending ? "Logging..." : "Log Payment"}
						</Button>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
