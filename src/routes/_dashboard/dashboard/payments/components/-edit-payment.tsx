import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PaymentStatus } from "generated/prisma/enums";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { parseServerError } from "@/lib/utils";
import { createPaymentFn, updatePaymentFn } from "@/modules/payment/serverFn";
import { deriveStatus, formatIDR } from "../utils/-utils";

export interface EditablePayment {
	id: string;
	tenantId: string;
	amountDue: number;
	amountPaid: number;
	status: PaymentStatus;
	tenantName: string;
	month: string;
	mode: "edit" | "create";
}

interface EditPaymentDialogProps {
	payment: EditablePayment;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function EditPaymentDialog({
	payment,
	open,
	onOpenChange,
}: EditPaymentDialogProps) {
	const queryClient = useQueryClient();
	const [error, setError] = useState("");
	const [amountPaid, setAmountPaid] = useState(payment.amountPaid);

	const mutation = useMutation({
		mutationFn: (newAmountPaid: number) => {
			const status = deriveStatus(payment.amountDue, newAmountPaid);
			if (payment.mode === "create") {
				return createPaymentFn({
					data: {
						tenantId: payment.tenantId,
						month: payment.month,
						amountDue: payment.amountDue,
						amountPaid: newAmountPaid,
						status,
					},
				});
			}
			return updatePaymentFn({
				data: {
					id: payment.id,
					amountPaid: newAmountPaid,
					status,
				},
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			queryClient.invalidateQueries({ queryKey: ["monthly-payments"] });
			toast.success("Payment updated");
			onOpenChange(false);
		},
		onError: (err) => setError(parseServerError(err)),
	});

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		const fd = new FormData(e.currentTarget);
		const paid = Number(fd.get("amountPaid"));
		mutation.mutate(paid);
	};

	const derivedStatus = deriveStatus(payment.amountDue, amountPaid);

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) {
					setError("");
					setAmountPaid(payment.amountPaid);
				}
				onOpenChange(o);
			}}
		>
			<DialogContent className="bg-card border-border text-card-foreground sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{payment.mode === "create" ? "Record Payment" : "Edit Payment"}
					</DialogTitle>
					<DialogDescription>
						{payment.mode === "create"
							? "Record a payment for this tenant."
							: "Update payment details."}
					</DialogDescription>
				</DialogHeader>

				<div className="text-sm text-muted-foreground -mt-1">
					{payment.tenantName} · {payment.month}
				</div>

				<form
					key={`${payment.tenantId}-${payment.month}`}
					onSubmit={handleSubmit}
					className="space-y-4 pt-1"
				>
					{error && (
						<p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
							{error}
						</p>
					)}

					<div className="space-y-1.5">
						<Label>Amount Due (IDR)</Label>
						<p className="font-medium text-sm py-1">
							{formatIDR(payment.amountDue)}
						</p>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="edit-amountPaid">Amount Paid (IDR)</Label>
						<Input
							id="edit-amountPaid"
							name="amountPaid"
							type="number"
							min={0}
							required
							defaultValue={payment.amountPaid}
							onChange={(e) => setAmountPaid(Number(e.target.value))}
						/>
					</div>

					<div className="space-y-1.5">
						<Label>Status (auto-derived)</Label>
						<div className="flex items-center gap-3 py-1">
							<StatusBadge status={derivedStatus} />
							{derivedStatus === "partial" && (
								<span className="text-xs text-muted-foreground">
									Outstanding: {formatIDR(payment.amountDue - amountPaid)}
								</span>
							)}
						</div>
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={mutation.isPending}
					>
						{mutation.isPending ? "Saving..." : "Save Changes"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
