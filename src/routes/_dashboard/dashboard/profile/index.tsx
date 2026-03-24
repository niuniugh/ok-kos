import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { extractFieldErrors, parseServerError } from "@/lib/utils";
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

	async function handleSave(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setFieldErrors({});

		const result = UpdateOwnerSchema.safeParse({ name, email });
		if (!result.success) {
			setFieldErrors(extractFieldErrors<keyof FieldErrors>(result.error));
			return;
		}

		setIsSaving(true);
		try {
			const updated = await updateOwnerFn({ data: { name, email } });
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

	if (isLoading)
		return (
			<div className="flex items-center justify-center p-8">
				<Spinner />
			</div>
		);

	if (!owner)
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-sm text-muted-foreground">Could not load profile</p>
			</div>
		);

	return (
		<div className="space-y-8 p-8 max-w-3xl mx-auto">
			<div>
				<h1 className="text-3xl font-bold">Profile</h1>
				<p className="text-sm text-muted-foreground">
					Manage your account settings
				</p>
			</div>

			<div className="space-y-6 p-6 bg-white rounded-lg border shadow-sm max-w-md">
				{/* Plan Info */}
				<div>
					<p className="text-sm font-medium text-gray-500">Plan</p>
					<div className="mt-1">
						<Badge
							variant={owner.plan === "paid" ? "default" : "secondary"}
							className="px-2 py-1 text-xs font-semibold"
						>
							{owner.plan === "free" ? "Free" : "Paid"}
						</Badge>
					</div>
				</div>

				{/* Member Since */}
				<div>
					<p className="text-sm font-medium text-gray-500">Member Since</p>
					<p className="text-sm text-gray-200 mt-1">
						{new Date(owner.createdAt).toLocaleDateString()}
					</p>
				</div>

				{/* Contact Info */}
				<div>
					<p className="text-sm font-medium text-gray-500">Email</p>
					<p className="text-sm text-gray-200 mt-1">{owner.email}</p>
				</div>

				<div className="h-px bg-zinc-700" />

				{/* Edit Form */}
				<form onSubmit={handleSave} className="space-y-4">
					<div className="space-y-2">
						<h2 className="text-lg font-semibold text-gray-300">
							Edit Profile
						</h2>
					</div>

					<div className="space-y-4">
						{/* Name Field */}
						<Field data-invalid={!!fieldErrors.name}>
							<FieldLabel htmlFor="name" className="text-gray-300">
								Name
							</FieldLabel>
							<Input
								id="name"
								type="text"
								placeholder="Your name"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									setFieldErrors((prev) => ({ ...prev, name: undefined }));
								}}
								className="bg-zinc-800 border border-zinc-700 text-gray-200 placeholder-zinc-500 focus:border-zinc-500 rounded-md w-full"
							/>
							<FieldError
								errors={fieldErrors.name ? [{ message: fieldErrors.name }] : []}
							/>
						</Field>

						{/* Email Field */}
						<Field data-invalid={!!fieldErrors.email}>
							<FieldLabel htmlFor="email" className="text-gray-300">
								Email
							</FieldLabel>
							<Input
								id="email"
								type="email"
								placeholder="your@email.com"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
									setFieldErrors((prev) => ({ ...prev, email: undefined }));
								}}
								className="bg-zinc-800 border border-zinc-700 text-gray-200 placeholder-zinc-500 focus:border-zinc-500 rounded-md w-full"
							/>
							<FieldError
								errors={
									fieldErrors.email ? [{ message: fieldErrors.email }] : []
								}
							/>
						</Field>
					</div>

					<Button type="submit" className="w-full" disabled={isSaving}>
						{isSaving ? "Saving..." : "Save Changes"}
					</Button>
				</form>
			</div>
		</div>
	);
}
