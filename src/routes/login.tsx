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
import { LoginSchema } from "@/modules/auth/schema";
import { loginFn } from "@/modules/auth/serverFn";
import { getCurrentSession } from "@/modules/sessions/serverFn";

export const Route = createFileRoute("/login")({
	component: LoginPage,
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

type FieldErrors = Partial<Record<"email" | "password", string>>;

function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [isLoading, setIsLoading] = useState(false);

	async function handleLogin(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();
		setFieldErrors({});

		const result = LoginSchema.safeParse({ email, password });
		if (!result.success) {
			setFieldErrors(extractFieldErrors<keyof FieldErrors>(result.error));
			return;
		}

		setIsLoading(true);
		try {
			await loginFn({ data: { email, password } });
			toast.success("Login successful! Redirecting...");
			setTimeout(() => {
				navigate({ to: "/dashboard" });
			}, 2000);
		} catch (error) {
			toast.error(parseServerError(error));
			setIsLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<form
				onSubmit={handleLogin}
				className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm"
			>
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold">Login</h1>
					<p className="text-sm text-muted-foreground">
						Enter your credentials to access your account
					</p>
				</div>

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
						autoComplete="current-password"
						placeholder="Enter your password"
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
					{isLoading ? "Logging in..." : "Login"}
				</Button>

				<p className="text-center text-sm text-muted-foreground">
					Don't have an account?{" "}
					<Link
						to="/register"
						className="text-foreground underline underline-offset-4 hover:text-primary"
					>
						Sign up
					</Link>
				</p>
			</form>
		</div>
	);
}
