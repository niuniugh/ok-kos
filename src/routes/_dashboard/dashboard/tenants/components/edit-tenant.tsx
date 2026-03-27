import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
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
				className="text-gray-400 hover:text-white hover:bg-zinc-800"
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
				<DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-white">Edit Tenant</DialogTitle>
					</DialogHeader>

					<form
						key={tenant.id + String(open)}
						onSubmit={handleSubmit}
						className="space-y-4 pt-1"
					>
						{error && (
							<p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
								{error}
							</p>
						)}

						<div className="space-y-1.5">
							<Label htmlFor="edit-name" className="text-gray-300">
								Full Name
							</Label>
							<Input
								id="edit-name"
								name="name"
								required
								defaultValue={tenant.name}
								className="bg-zinc-800 border-zinc-700 text-white"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="edit-phone" className="text-gray-300">
								Phone Number
							</Label>
							<Input
								id="edit-phone"
								name="phone"
								required
								defaultValue={tenant.phone}
								className="bg-zinc-800 border-zinc-700 text-white"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="edit-moveInDate" className="text-gray-300">
								Move-in Date
							</Label>
							<Input
								id="edit-moveInDate"
								name="moveInDate"
								type="date"
								required
								defaultValue={normalizedMoveInDate}
								min="2020-01-01"
								className="bg-zinc-800 border-zinc-700 text-white"
							/>
						</div>

						<Button
							type="submit"
							className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
