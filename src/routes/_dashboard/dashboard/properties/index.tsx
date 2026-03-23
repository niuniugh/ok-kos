import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPropertyFn, getPropertiesFn } from "@/modules/property/serverFn";

export const Route = createFileRoute("/_dashboard/dashboard/properties/")({
	component: PropertiesPage,
});

function PropertiesPage() {
	const queryClient = useQueryClient();
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const { data: properties, isLoading } = useQuery({
		queryKey: ["properties"],
		queryFn: () => getPropertiesFn(),
	});

	const createMutation = useMutation({
		mutationFn: createPropertyFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["properties"] });
			queryClient.invalidateQueries({ queryKey: ["properties-count"] });
			toast.success("Property created successfully");
			setIsCreateOpen(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create property");
		},
	});

	const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const address = formData.get("address") as string;

		if (!name || !address) {
			toast.error("Please fill in all fields");
			return;
		}

		createMutation.mutate({ data: { name, address } });
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-white">Properties</h1>
					<p className="text-gray-400">Manage your kos properties</p>
				</div>

				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>Add Property</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add New Property</DialogTitle>
							<DialogDescription>
								Create a new property to start adding rooms and tenants.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleCreate} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Property Name</Label>
								<Input
									id="name"
									name="name"
									placeholder="e.g. Kos Mawar"
									disabled={createMutation.isPending}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="address">Address</Label>
								<Input
									id="address"
									name="address"
									placeholder="e.g. Jl. Mawar No. 1"
									disabled={createMutation.isPending}
								/>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsCreateOpen(false)}
									disabled={createMutation.isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={createMutation.isPending}>
									{createMutation.isPending ? "Creating..." : "Create Property"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{isLoading ? (
				<div className="text-gray-400">Loading properties...</div>
			) : properties?.length === 0 ? (
				<div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
					<p className="text-gray-400 mb-4">No properties found</p>
					<Button onClick={() => setIsCreateOpen(true)} variant="outline">
						Add Your First Property
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{properties?.map((property) => (
						<Link
							key={property.id}
							to="/dashboard/properties/$propertyId"
							params={{ propertyId: property.id }}
							className="block group"
						>
							<Card className="h-full hover:border-zinc-500 transition-colors bg-zinc-900 border-zinc-800">
								<CardHeader>
									<CardTitle className="text-lg text-white group-hover:text-blue-400 transition-colors">
										{property.name}
									</CardTitle>
									<CardDescription className="line-clamp-1">
										{property.address}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="flex items-center text-sm text-gray-400">
										<span className="bg-zinc-800 px-2 py-1 rounded-md">
											{property._count.rooms} Rooms
										</span>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
