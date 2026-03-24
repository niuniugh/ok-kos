import { createServerOnlyFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

interface UserData {
	id: string;
	name: string;
	email: string;
	plan: string;
}

const SESSION_COOKIE_NAME = "app-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const getSessionSecret = createServerOnlyFn(() => {
	const SESSION_SECRET = process.env.SESSION_SECRET;
	if (!SESSION_SECRET) {
		throw new Error("SESSION_SECRET is not set. Check your .env file.");
	}

	return SESSION_SECRET;
});

export function useAppSession() {
	const SESSION_SECRET = getSessionSecret();

	return useSession<UserData>({
		name: SESSION_COOKIE_NAME,
		password: SESSION_SECRET,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: SESSION_MAX_AGE,
		},
	});
}
