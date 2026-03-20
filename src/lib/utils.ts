import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ZodError } from "zod";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function extractFieldErrors<T extends string>(
	error: ZodError,
): Partial<Record<T, string>> {
	const errors: Partial<Record<T, string>> = {};
	for (const issue of error.issues) {
		const field = issue.path[0] as T;
		if (!errors[field]) errors[field] = issue.message;
	}
	return errors;
}

export function parseServerError(error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);

	try {
		const parsed = JSON.parse(message);
		if (Array.isArray(parsed)) {
			return parsed
				.map((e: { message?: string }) => e.message)
				.filter(Boolean)
				.join(". ");
		}
	} catch {
		// not JSON — return as-is
	}

	return message;
}
