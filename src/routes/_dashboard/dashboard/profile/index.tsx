import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
				<p className="text-sm text-gray-400">Could not load profile</p>
			</div>
		);

	return (
		<div className="space-y-6 max-w-xl mx-auto">
			<div>
				<h1 className="text-2xl font-bold text-white">Profile</h1>
				<p className="text-gray-400">Manage your account settings</p>
			</div>

			{/* Account Info */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm text-gray-400">
						Account Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs text-gray-500">Plan</p>
							<Badge
								variant={owner.plan === "paid" ? "default" : "secondary"}
								className="mt-1"
							>
								{owner.plan === "free" ? "Free" : "Paid"}
							</Badge>
						</div>
						<div className="text-right">
							<p className="text-xs text-gray-500">Member Since</p>
							<p className="text-sm text-white mt-1">
								{new Date(owner.createdAt).toLocaleDateString("id-ID", {
									day: "2-digit",
									month: "long",
									year: "numeric",
								})}
							</p>
						</div>
					</div>

					<div>
						<p className="text-xs text-gray-500">Email</p>
						<p className="text-sm text-white mt-1">{owner.email}</p>
					</div>
				</CardContent>
			</Card>

			{/* Edit Form */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm text-gray-400">Edit Profile</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSave} className="space-y-4">
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
								className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500"
							/>
							<FieldError
								errors={fieldErrors.name ? [{ message: fieldErrors.name }] : []}
							/>
						</Field>

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
								className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500"
							/>
							<FieldError
								errors={
									fieldErrors.email ? [{ message: fieldErrors.email }] : []
								}
							/>
						</Field>

						<Button type="submit" className="w-full" disabled={isSaving}>
							{isSaving ? "Saving..." : "Save Changes"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
