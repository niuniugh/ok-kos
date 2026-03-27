import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { extractFieldErrors, parseServerError } from "@/lib/utils";
import { RegisterSchema } from "@/modules/auth/schema";
import { registerFn } from "@/modules/auth/serverFn";
import { getCurrentSession } from "@/modules/sessions/serverFn";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
	beforeLoad: async () => {
		try {
			const session = await getCurrentSession();
			if (session.email) {
				throw redirect({ to: "/dashboard" });
			}
		} catch (error) {
			if (error instanceof Response) throw error;
		}
	},
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
			setFieldErrors(extractFieldErrors<keyof FieldErrors>(result.error));
			return;
		}

		setIsLoading(true);
		try {
			await registerFn({ data: { name, email, password } });
			toast.success("Account created! Please login.");
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
						autoComplete="name"
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
						autoComplete="email"
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
						autoComplete="new-password"
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
