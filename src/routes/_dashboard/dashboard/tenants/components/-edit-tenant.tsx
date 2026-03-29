import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
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
import { parseServerError } from "@/lib/utils";
import { updateTenantFn } from "@/modules/tenant/serverFn";

export interface EditableTenant {
	id: string;
	name: string;
	phone: string;
	moveInDate: Date | string;
}

interface EditTenantDialogProps {
	tenant: EditableTenant;
	onSuccess?: () => void;
}

export function EditTenantDialog({ tenant, onSuccess }: EditTenantDialogProps) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [error, setError] = useState("");

	const normalizedMoveInDate = new Date(tenant.moveInDate)
		.toISOString()
		.slice(0, 10);

	const mutation = useMutation({
		mutationFn: (data: { name: string; phone: string; moveInDate: string }) =>
			updateTenantFn({ data: { id: tenant.id, ...data } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tenant", tenant.id] });
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
			toast.success("Tenant updated");
			setOpen(false);
			onSuccess?.();
		},
		onError: (err) => setError(parseServerError(err)),
	});

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		const fd = new FormData(e.currentTarget);
		const name = (fd.get("name") as string).trim();
		const phone = (fd.get("phone") as string).trim();
		const moveInDate = fd.get("moveInDate") as string;

		mutation.mutate({ name, phone, moveInDate });
	};

	return (
		<>
			<Button
				variant="ghost"
				size="sm"
				className="text-muted-foreground hover:text-foreground hover:bg-accent"
				onClick={() => {
					setError("");
					setOpen(true);
				}}
			>
				<Pencil className="w-3.5 h-3.5 mr-1.5" />
				Edit
			</Button>

			<Dialog
				open={open}
				onOpenChange={(o) => {
					if (!o) setError("");
					setOpen(o);
				}}
			>
				<DialogContent className="bg-card border-border text-card-foreground sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit Tenant</DialogTitle>
						<DialogDescription>Update tenant information.</DialogDescription>
					</DialogHeader>

					<form
						key={tenant.id + String(open)}
						onSubmit={handleSubmit}
						className="space-y-4 pt-1"
					>
						{error && (
							<p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
								{error}
							</p>
						)}

						<div className="space-y-1.5">
							<Label htmlFor="edit-name">Full Name</Label>
							<Input
								id="edit-name"
								name="name"
								required
								defaultValue={tenant.name}
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="edit-phone">Phone Number</Label>
							<Input
								id="edit-phone"
								name="phone"
								required
								defaultValue={tenant.phone}
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="edit-moveInDate">Move-in Date</Label>
							<Input
								id="edit-moveInDate"
								name="moveInDate"
								type="date"
								required
								defaultValue={normalizedMoveInDate}
								min="2020-01-01"
							/>
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
		</>
	);
}
