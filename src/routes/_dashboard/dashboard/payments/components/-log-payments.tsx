import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { StatusBadge } from "@/components/ui/status-badge";
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
			<Button onClick={() => setOpen(true)}>
				<PlusIcon className="w-4 h-4 mr-2" />
				Log Payment
			</Button>

			<Dialog
				open={open}
				onOpenChange={(o) => {
					if (!o) handleClose();
				}}
			>
				<DialogContent className="bg-card border-border text-card-foreground sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Log Payment</DialogTitle>
						<DialogDescription>
							Record a payment for a tenant.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4 pt-1">
						{error && (
							<p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
								{error}
							</p>
						)}

						<div className="space-y-1.5">
							<Label>Tenant</Label>
							<Select value={tenantId} onValueChange={handleTenantChange}>
								<SelectTrigger>
									<SelectValue placeholder="Select tenant" />
								</SelectTrigger>
								<SelectContent>
									{activeTenants.map((t) => (
										<SelectItem key={t.id} value={t.id}>
											{t.name} — Room {t.roomNumber}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="log-month">Month</Label>
							<Input
								id="log-month"
								name="month"
								type="month"
								required
								defaultValue={currentMonth()}
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="log-amountDue">Amount Due (IDR)</Label>
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
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="log-amountPaid">Amount Paid (IDR)</Label>
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
							/>
							{amountDue > 0 && (
								<p className="text-xs text-muted-foreground">
									Max: {formatIDR(amountDue)}
								</p>
							)}
						</div>

						{amountDue > 0 && (
							<div className="space-y-1.5">
								<Label>Status</Label>
								<div className="flex items-center gap-3 py-1">
									<StatusBadge status={derivedStatus} />
									{derivedStatus === "partial" && (
										<span className="text-xs text-muted-foreground">
											Outstanding: {formatIDR(amountDue - amountPaid)}
										</span>
									)}
								</div>
							</div>
						)}

						<Button
							type="submit"
							className="w-full"
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
