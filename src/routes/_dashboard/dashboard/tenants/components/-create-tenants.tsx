import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { parseServerError } from "@/lib/utils";
import { getPropertiesFn } from "@/modules/property/serverFn";
import { getRoomsFn } from "@/modules/room/serverFn";
import { createTenantFn } from "@/modules/tenant/serverFn";

interface CreateTenantDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateTenantDialog({
	open,
	onOpenChange,
}: CreateTenantDialogProps) {
	const queryClient = useQueryClient();
	const [propertyId, setPropertyId] = useState("");
	const [roomId, setRoomId] = useState("");
	const [error, setError] = useState("");

	const { data: propertiesRes } = useQuery({
		queryKey: ["properties"],
		queryFn: () => getPropertiesFn(),
		enabled: open,
	});
	const properties = propertiesRes ?? [];

	const { data: vacantRooms = [], isLoading: roomsLoading } = useQuery({
		queryKey: ["rooms", propertyId, "vacant"],
		queryFn: () => getRoomsFn({ data: { propertyId, status: "vacant" } }),
		enabled: !!propertyId,
	});

	const mutation = useMutation({
		mutationFn: (data: {
			roomId: string;
			name: string;
			phone: string;
			moveInDate: string;
		}) => createTenantFn({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tenants"] });
			queryClient.invalidateQueries({ queryKey: ["rooms"] });
			toast.success("Tenant added successfully");
			handleClose();
		},
		onError: (err) => setError(parseServerError(err)),
	});

	const handleClose = () => {
		setPropertyId("");
		setRoomId("");
		setError("");
		onOpenChange(false);
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		const fd = new FormData(e.currentTarget);
		const name = (fd.get("name") as string).trim();
		const phone = (fd.get("phone") as string).trim();
		const moveInDate = fd.get("moveInDate") as string;

		if (!roomId) {
			setError("Please select a room.");
			return;
		}

		mutation.mutate({ roomId, name, phone, moveInDate });
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) handleClose();
			}}
		>
			<DialogContent className="bg-card border-border text-card-foreground sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add Tenant</DialogTitle>
					<DialogDescription>Add a new tenant to a room.</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-1">
					{error && (
						<p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
							{error}
						</p>
					)}

					{/* Property selector */}
					<div className="space-y-1.5">
						<Label>Property</Label>
						<Select
							value={propertyId}
							onValueChange={(v) => {
								setPropertyId(v);
								setRoomId("");
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select property" />
							</SelectTrigger>
							<SelectContent>
								{properties.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Room selector */}
					<div className="space-y-1.5">
						<Label>Room (vacant only)</Label>
						<Select
							value={roomId}
							onValueChange={setRoomId}
							disabled={!propertyId}
						>
							<SelectTrigger className="disabled:opacity-50">
								<SelectValue
									placeholder={
										!propertyId
											? "Select a property first"
											: roomsLoading
												? "Loading rooms..."
												: "Select room"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{vacantRooms.length === 0 ? (
									<div className="px-3 py-2 text-sm text-muted-foreground">
										No vacant rooms available
									</div>
								) : (
									vacantRooms.map((r) => (
										<SelectItem key={r.id} value={r.id}>
											Room {r.roomNumber} — Rp{" "}
											{r.rentPrice.toLocaleString("id-ID")}
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="create-name">Full Name</Label>
						<Input
							id="create-name"
							name="name"
							required
							placeholder="e.g. Budi Santoso"
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="create-phone">Phone Number</Label>
						<Input
							id="create-phone"
							name="phone"
							required
							placeholder="e.g. 08123456789"
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="create-moveInDate">Move-in Date</Label>
						<Input
							id="create-moveInDate"
							name="moveInDate"
							type="date"
							min="2020-01-01"
							required
						/>
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={mutation.isPending}
					>
						{mutation.isPending ? "Adding..." : "Add Tenant"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
