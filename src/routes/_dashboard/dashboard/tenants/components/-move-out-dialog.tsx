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
					className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
				>
					<LogOut className="w-3.5 h-3.5 mr-1" />
					Move Out
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="bg-card border-border">
				<AlertDialogHeader>
					<AlertDialogTitle>Move out {tenant.name}?</AlertDialogTitle>
					<AlertDialogDescription>
						This will mark the tenant as inactive and free up room{" "}
						{tenant.roomNumber}. Their payment history will be preserved.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						onClick={() => moveOutMutation.mutate(tenant.id)}
					>
						Confirm Move Out
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
