import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { parseServerError } from "@/lib/utils";
import { moveOutTenantFn } from "@/modules/tenant/serverFn";

export interface MoveOutTenant {
	id: string;
	name: string;
	roomNumber: string;
}

interface MoveOutTenantDialogProps {
	tenant: MoveOutTenant;
	onSuccess?: () => void;
}
export function MoveOutDialog({ tenant, onSuccess }: MoveOutTenantDialogProps) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const moveOutMutation = useMutation({
		mutationFn: (id: string) => moveOutTenantFn({ data: { id } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
			queryClient.invalidateQueries({ queryKey: ["rooms"] });
			toast.success("Tenant moved out successfully");
			setOpen(false);
			onSuccess?.();
		},
		onError: (err) => toast.error(parseServerError(err)),
	});
	return (
		<AlertDialog
			open={open}
			onOpenChange={(o) => {
				setOpen(o);
			}}
		>
			<AlertDialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="text-gray-400 hover:text-red-400 hover:bg-red-950/40"
				>
					<LogOut className="w-3.5 h-3.5 mr-1" />
					Move Out
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="bg-zinc-900 border-zinc-800">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-white">
						Move out {tenant.name}?
					</AlertDialogTitle>
					<AlertDialogDescription className="text-gray-400">
						This will mark the tenant as inactive and free up room{" "}
						{tenant.roomNumber}. Their payment history will be preserved.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						className="bg-red-600 hover:bg-red-700 text-white"
						onClick={() => moveOutMutation.mutate(tenant.id)}
					>
						Confirm Move Out
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
