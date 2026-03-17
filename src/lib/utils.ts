import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
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
