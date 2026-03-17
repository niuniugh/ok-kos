import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { parseServerError } from "@/lib/utils";
import { RegisterSchema } from "@/modules/auth/schema";
import { registerFn } from "@/modules/auth/serverFn";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});

type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

function RegisterPage() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [isLoading, setIsLoading] = useState(false);

	async function handleRegister(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();
		setFieldErrors({});

		const result = RegisterSchema.safeParse({ name, email, password });
		if (!result.success) {
			const errors: FieldErrors = {};
			for (const issue of result.error.issues) {
				const field = issue.path[0] as keyof FieldErrors;
				if (!errors[field]) errors[field] = issue.message;
			}
			setFieldErrors(errors);
			return;
		}

		setIsLoading(true);
		try {
			await registerFn({ data: { name, email, password } });
			navigate({ to: "/login" });
		} catch (error) {
			toast.error(parseServerError(error));
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<form
				onSubmit={handleRegister}
				className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm"
			>
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold">Register</h1>
					<p className="text-sm text-muted-foreground">
						Create an account to get started
					</p>
				</div>

				<Field data-invalid={!!fieldErrors.name}>
					<FieldLabel htmlFor="name">Name</FieldLabel>
					<Input
						id="name"
						type="text"
						placeholder="John Doe"
						value={name}
						onChange={(e) => {
							setName(e.target.value);
							setFieldErrors((prev) => ({ ...prev, name: undefined }));
						}}
					/>
					<FieldError
						errors={fieldErrors.name ? [{ message: fieldErrors.name }] : []}
					/>
				</Field>

				<Field data-invalid={!!fieldErrors.email}>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value);
							setFieldErrors((prev) => ({ ...prev, email: undefined }));
						}}
					/>
					<FieldError
						errors={fieldErrors.email ? [{ message: fieldErrors.email }] : []}
					/>
				</Field>

				<Field data-invalid={!!fieldErrors.password}>
					<FieldLabel htmlFor="password">Password</FieldLabel>
					<Input
						id="password"
						type="password"
						placeholder="Create a password"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
							setFieldErrors((prev) => ({ ...prev, password: undefined }));
						}}
					/>
					<FieldError
						errors={
							fieldErrors.password ? [{ message: fieldErrors.password }] : []
						}
					/>
				</Field>

				<Button type="submit" className="w-full" disabled={isLoading}>
					{isLoading ? "Creating account..." : "Register"}
				</Button>

				<p className="text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link
						to="/login"
						className="text-foreground underline underline-offset-4 hover:text-primary"
					>
						Sign in
					</Link>
				</p>
			</form>
		</div>
	);
}
