import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { parseServerError } from "@/lib/utils";
import { UpdateOwnerSchema } from "@/modules/owner/schema";
import { getOwnerFn, updateOwnerFn } from "@/modules/owner/serverFn";

export const Route = createFileRoute("/_dashboard/dashboard/profile/")({
	component: ProfilePage,
});

type FieldErrors = Partial<Record<"name" | "email", string>>;

function ProfilePage() {
	const [owner, setOwner] = useState<{
		id: string;
		name: string;
		email: string;
		plan: string;
		createdAt: string;
	} | null>(null);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// Load owner data on mount
	useEffect(() => {
		async function loadOwner() {
			try {
				const data = await getOwnerFn();
				setOwner({
					...data,
					createdAt:
						data.createdAt instanceof Date
							? data.createdAt.toISOString()
							: data.createdAt,
				});
				setName(data.name);
				setEmail(data.email);
			} catch (error) {
				toast.error(parseServerError(error));
			} finally {
				setIsLoading(false);
			}
		}

		loadOwner();
	}, []);

	async function handleSave(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();
		setFieldErrors({});

		const result = UpdateOwnerSchema.safeParse({ name, email });
		if (!result.success) {
			const errors: FieldErrors = {};
			for (const issue of result.error.issues) {
				const field = issue.path[0] as keyof FieldErrors;
				if (!errors[field]) errors[field] = issue.message;
			}
			setFieldErrors(errors);
			return;
		}

		setIsSaving(true);
		try {
			const updated = await updateOwnerFn({
				data: { name, email },
			});
			setOwner({
				...updated,
				createdAt:
					updated.createdAt instanceof Date
						? updated.createdAt.toISOString()
						: updated.createdAt,
			});
			toast.success("Profile updated successfully");
		} catch (error) {
			toast.error(parseServerError(error));
		} finally {
			setIsSaving(false);
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-sm text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (!owner) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-sm text-muted-foreground">Could not load profile</p>
			</div>
		);
	}

	return (
		<div className="space-y-8 p-8">
			<div>
				<h1 className="text-3xl font-bold">Profile</h1>
				<p className="text-sm text-muted-foreground">
					Manage your account settings
				</p>
			</div>

			<div className="max-w-md space-y-6 rounded-lg border p-6 shadow-sm">
				{/* Display current info */}
				<div className="space-y-4">
					<div>
						<p className="text-sm font-medium text-muted-foreground">Plan</p>
						<div className="mt-1">
							<Badge variant={owner.plan === "paid" ? "default" : "secondary"}>
								{owner.plan === "free" ? "Free" : "Paid"}
							</Badge>
						</div>
					</div>

					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Member Since
						</p>
						<p className="text-sm">
							{new Date(owner.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>

				<div className="h-px bg-border" />

				{/* Edit form */}
				<form onSubmit={handleSave} className="space-y-4">
					<div className="space-y-2">
						<h2 className="text-lg font-semibold">Edit Profile</h2>
					</div>

					<Field data-invalid={!!fieldErrors.name}>
						<FieldLabel htmlFor="name">Name</FieldLabel>
						<Input
							id="name"
							type="text"
							placeholder="Your name"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								setFieldErrors((prev) => ({
									...prev,
									name: undefined,
								}));
							}}
						/>
						<FieldError
							errors={
								fieldErrors.name
									? [
											{
												message: fieldErrors.name,
											},
										]
									: []
							}
						/>
					</Field>

					<Field data-invalid={!!fieldErrors.email}>
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<Input
							id="email"
							type="email"
							placeholder="your@email.com"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setFieldErrors((prev) => ({
									...prev,
									email: undefined,
								}));
							}}
						/>
						<FieldError
							errors={
								fieldErrors.email
									? [
											{
												message: fieldErrors.email,
											},
										]
									: []
							}
						/>
					</Field>

					<Button type="submit" className="w-full" disabled={isSaving}>
						{isSaving ? "Saving..." : "Save Changes"}
					</Button>
				</form>
			</div>
		</div>
	);
}
