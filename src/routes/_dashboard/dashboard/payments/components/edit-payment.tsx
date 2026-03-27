import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PaymentStatus } from "generated/prisma/enums";
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
import { parseServerError } from "@/lib/utils";
import { createPaymentFn, updatePaymentFn } from "@/modules/payment/serverFn";
import { deriveStatus, formatIDR } from "../utils/utils";

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
			<DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-white">
						{payment.mode === "create" ? "Record Payment" : "Edit Payment"}
					</DialogTitle>
					<DialogDescription>
						{payment.mode === "create"
							? "Record a payment for this tenant."
							: "Update payment details."}
					</DialogDescription>
				</DialogHeader>

				<div className="text-sm text-gray-400 -mt-1">
					{payment.tenantName} · {payment.month}
				</div>

				<form
					key={`${payment.tenantId}-${payment.month}`}
					onSubmit={handleSubmit}
					className="space-y-4 pt-1"
				>
					{error && (
						<p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
							{error}
						</p>
					)}

					<div className="space-y-1.5">
						<Label className="text-gray-300">Amount Due (IDR)</Label>
						<p className="text-white font-medium text-sm py-1">
							{formatIDR(payment.amountDue)}
						</p>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="edit-amountPaid" className="text-gray-300">
							Amount Paid (IDR)
						</Label>
						<Input
							id="edit-amountPaid"
							name="amountPaid"
							type="number"
							min={0}
							required
							defaultValue={payment.amountPaid}
							onChange={(e) => setAmountPaid(Number(e.target.value))}
							className="bg-zinc-800 border-zinc-700 text-white"
						/>
					</div>

					<div className="space-y-1.5">
						<Label className="text-gray-300">Status (auto-derived)</Label>
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
