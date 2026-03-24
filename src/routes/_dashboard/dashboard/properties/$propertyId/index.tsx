import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowLeft,
	DoorOpen,
	Edit,
	Info,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getOwnerFn } from "@/modules/owner/serverFn";
import {
	deletePropertyFn,
	getPropertyFn,
	updatePropertyFn,
} from "@/modules/property/serverFn";
import {
	createRoomFn,
	deleteRoomFn,
	getRoomsFn,
	updateRoomFn,
} from "@/modules/room/serverFn";

export const Route = createFileRoute(
	"/_dashboard/dashboard/properties/$propertyId/",
)({
	component: PropertyDetailPage,
});

function PropertyDetailPage() {
	const { propertyId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const { data: property, isLoading: isPropertyLoading } = useQuery({
		queryKey: ["property", propertyId],
		queryFn: () => getPropertyFn({ data: { id: propertyId } }),
	});

	const { data: rooms, isLoading: isRoomsLoading } = useQuery({
		queryKey: ["rooms", propertyId],
		queryFn: () => getRoomsFn({ data: { propertyId } }),
	});

	const { data: owner } = useQuery({
		queryKey: ["owner"],
		queryFn: getOwnerFn,
	});

	const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
	const [isUpgradePromptOpen, setIsUpgradePromptOpen] = useState(false);
	const [editingRoom, setEditingRoom] = useState<{
		id: string;
		roomNumber: string;
		rentPrice: number;
	} | null>(null);
	const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

	const updateMutation = useMutation({
		mutationFn: updatePropertyFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
			queryClient.invalidateQueries({ queryKey: ["properties"] });
			toast.success("Property updated successfully");
			setIsEditOpen(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update property");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deletePropertyFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["properties"] });
			queryClient.invalidateQueries({ queryKey: ["properties-count"] });
			toast.success("Property deleted successfully");
			navigate({ to: "/dashboard/properties" });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete property");
			setIsDeleteOpen(false);
		},
	});

	const createRoomMutation = useMutation({
		mutationFn: createRoomFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rooms", propertyId] });
			queryClient.invalidateQueries({ queryKey: ["properties"] });
			toast.success("Room created successfully");
			setIsCreateRoomOpen(false);
		},
		onError: (error) => {
			if (error.message.includes("FREE_PLAN_LIMIT_REACHED")) {
				setIsCreateRoomOpen(false);
				setIsUpgradePromptOpen(true);
			} else {
				toast.error(error.message || "Failed to create room");
			}
		},
	});

	const updateRoomMutation = useMutation({
		mutationFn: updateRoomFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rooms", propertyId] });
			toast.success("Room updated successfully");
			setEditingRoom(null);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update room");
		},
	});

	const deleteRoomMutation = useMutation({
		mutationFn: deleteRoomFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rooms", propertyId] });
			queryClient.invalidateQueries({ queryKey: ["properties"] });
			toast.success("Room deleted successfully");
			setDeletingRoomId(null);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete room");
			setDeletingRoomId(null);
		},
	});

	const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const address = formData.get("address") as string;

		if (!name || !address) {
			toast.error("Please fill in all fields");
			return;
		}

		updateMutation.mutate({ data: { id: propertyId, name, address } });
	};

	const handleDelete = () => {
		deleteMutation.mutate({ data: { id: propertyId } });
	};

	const handleCreateRoom = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const roomNumber = formData.get("roomNumber") as string;
		const rentPrice = Number(formData.get("rentPrice"));

		if (!roomNumber || !rentPrice || rentPrice <= 0) {
			toast.error("Please provide a valid room number and rent price");
			return;
		}

		createRoomMutation.mutate({
			data: { propertyId, roomNumber, rentPrice },
		});
	};

	const handleUpdateRoom = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingRoom) return;

		const formData = new FormData(e.currentTarget);
		const roomNumber = formData.get("roomNumber") as string;
		const rentPrice = Number(formData.get("rentPrice"));

		if (!roomNumber || !rentPrice || rentPrice <= 0) {
			toast.error("Please provide a valid room number and rent price");
			return;
		}

		updateRoomMutation.mutate({
			data: { id: editingRoom.id, roomNumber, rentPrice },
		});
	};

	const handleDeleteRoom = () => {
		if (!deletingRoomId) return;
		deleteRoomMutation.mutate({ data: { id: deletingRoomId } });
	};

	if (isPropertyLoading || isRoomsLoading) {
		return <div className="text-gray-400">Loading property details...</div>;
	}

	if (!property) {
		return <div className="text-red-400">Property not found</div>;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						size="icon"
						onClick={() => navigate({ to: "/dashboard/properties" })}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold text-white">{property.name}</h1>
						<p className="text-gray-400">{property.address}</p>
					</div>
				</div>

				<div className="flex gap-2">
					<Button variant="outline" onClick={() => setIsEditOpen(true)}>
						<Edit className="h-4 w-4 mr-2" />
						Edit
					</Button>
					<Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
						<Trash2 className="h-4 w-4 mr-2" />
						Delete
					</Button>
				</div>
			</div>

			{/* Rooms Section */}
			<div className="space-y-4">
				{/* Freemium Warning */}
				{owner?.plan === "free" && rooms && rooms.length >= 8 && (
					<Alert
						variant={rooms.length >= 10 ? "destructive" : "default"}
						className={
							rooms.length >= 10
								? "border-red-500/50 bg-red-500/10"
								: "border-yellow-500/50 bg-yellow-500/10 text-yellow-200"
						}
					>
						<AlertTriangle className="h-4 w-4" />
						<AlertTitle>
							{rooms.length >= 10 ? "Limit Reached" : "Approaching Limit"}
						</AlertTitle>
						<AlertDescription>
							You have {rooms.length} out of 10 free rooms used for this
							property.{" "}
							{rooms.length >= 10
								? "Upgrade to a paid plan to add more rooms."
								: "Consider upgrading soon to add unlimited rooms."}
						</AlertDescription>
					</Alert>
				)}

				<Card className="bg-zinc-900 border-zinc-800">
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle className="text-white">Rooms</CardTitle>
							<CardDescription>
								Manage rooms for {property.name}
							</CardDescription>
						</div>
						<Button
							onClick={() => {
								if (owner?.plan === "free" && rooms && rooms.length >= 10) {
									setIsUpgradePromptOpen(true);
								} else {
									setIsCreateRoomOpen(true);
								}
							}}
							disabled={owner?.plan === "free" && rooms && rooms.length >= 10}
						>
							Add Room
						</Button>
					</CardHeader>
					<CardContent>
						{!rooms || rooms.length === 0 ? (
							<EmptyState
								icon={DoorOpen}
								title="No rooms yet"
								description="Add your first room to start assigning tenants."
								actionLabel="Add Room"
								onAction={() => setIsCreateRoomOpen(true)}
							/>
						) : (
							<div className="rounded-md border border-zinc-800">
								<Table>
									<TableHeader>
										<TableRow className="border-zinc-800 hover:bg-transparent">
											<TableHead>Room Number</TableHead>
											<TableHead>Rent Price</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{rooms.map((room) => (
											<TableRow
												key={room.id}
												className="border-zinc-800 hover:bg-zinc-800/50"
											>
												<TableCell className="font-medium text-white">
													{room.roomNumber}
												</TableCell>
												<TableCell className="text-gray-300">
													Rp {room.rentPrice.toLocaleString("id-ID")}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															room.status === "vacant" ? "secondary" : "default"
														}
														className={
															room.status === "vacant"
																? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
																: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
														}
													>
														{room.status === "vacant" ? "Vacant" : "Occupied"}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																setEditingRoom({
																	id: room.id,
																	roomNumber: room.roomNumber,
																	rentPrice: room.rentPrice,
																})
															}
														>
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
															onClick={() => setDeletingRoomId(room.id)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Edit Dialog */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Property</DialogTitle>
						<DialogDescription>
							Update the details of your property.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleUpdate} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Property Name</Label>
							<Input
								id="name"
								name="name"
								defaultValue={property.name}
								disabled={updateMutation.isPending}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="address">Address</Label>
							<Input
								id="address"
								name="address"
								defaultValue={property.address}
								disabled={updateMutation.isPending}
							/>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsEditOpen(false)}
								disabled={updateMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending ? "Saving..." : "Save Changes"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Alert Dialog */}
			<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							property <strong>{property.name}</strong> and all its rooms.
							<br />
							<br />
							Note: You cannot delete a property if it has rooms with active
							tenants.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							disabled={deleteMutation.isPending}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{deleteMutation.isPending ? "Deleting..." : "Delete Property"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Create Room Dialog */}
			<Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add New Room</DialogTitle>
						<DialogDescription>
							Add a new room to {property.name}.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleCreateRoom} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="roomNumber">Room Number / Name</Label>
							<Input
								id="roomNumber"
								name="roomNumber"
								placeholder="e.g. 101, A1, VIP"
								disabled={createRoomMutation.isPending}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="rentPrice">Rent Price (Monthly)</Label>
							<Input
								id="rentPrice"
								name="rentPrice"
								type="number"
								min="1"
								placeholder="e.g. 1500000"
								disabled={createRoomMutation.isPending}
							/>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsCreateRoomOpen(false)}
								disabled={createRoomMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={createRoomMutation.isPending}>
								{createRoomMutation.isPending ? "Creating..." : "Create Room"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Room Dialog */}
			<Dialog
				open={!!editingRoom}
				onOpenChange={(open) => !open && setEditingRoom(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Room</DialogTitle>
						<DialogDescription>Update room details.</DialogDescription>
					</DialogHeader>

					{editingRoom && (
						<form onSubmit={handleUpdateRoom} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="edit-roomNumber">Room Number / Name</Label>
								<Input
									id="edit-roomNumber"
									name="roomNumber"
									defaultValue={editingRoom.roomNumber}
									disabled={updateRoomMutation.isPending}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-rentPrice">Rent Price (Monthly)</Label>
								<Input
									id="edit-rentPrice"
									name="rentPrice"
									type="number"
									min="1"
									defaultValue={editingRoom.rentPrice}
									disabled={updateRoomMutation.isPending}
								/>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setEditingRoom(null)}
									disabled={updateRoomMutation.isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={updateRoomMutation.isPending}>
									{updateRoomMutation.isPending ? "Saving..." : "Save Changes"}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete Room Alert Dialog */}
			<AlertDialog
				open={!!deletingRoomId}
				onOpenChange={(open) => !open && setDeletingRoomId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Room</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this room? This action cannot be
							undone.
							<br />
							<br />
							Note: You cannot delete a room that is currently occupied.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteRoomMutation.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDeleteRoom();
							}}
							disabled={deleteRoomMutation.isPending}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{deleteRoomMutation.isPending ? "Deleting..." : "Delete Room"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Upgrade Prompt Dialog */}
			<Dialog open={isUpgradePromptOpen} onOpenChange={setIsUpgradePromptOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Info className="h-5 w-5 text-blue-400" />
							Upgrade Required
						</DialogTitle>
						<DialogDescription className="pt-4 text-base">
							You have reached the maximum limit of 10 rooms per property on the
							Free plan.
							<br />
							<br />
							Please upgrade your plan to add unlimited rooms and unlock premium
							features.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-6">
						<Button
							variant="outline"
							onClick={() => setIsUpgradePromptOpen(false)}
						>
							Close
						</Button>
						<Button onClick={() => setIsUpgradePromptOpen(false)}>
							Upgrade Plan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
