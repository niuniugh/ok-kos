import { createServerOnlyFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

interface UserData {
	id: string;
	name: string;
	email: string;
}

const getSessionSecret = createServerOnlyFn(() => {
	const SESSION_SECRET = process.env.SESSION_SECRET;
	if (!SESSION_SECRET) {
		throw new Error("SESSION SECRET IS NOT SET");
	}

	return SESSION_SECRET;
});

export function useAppSession() {
	const SESSION_SECRET = getSessionSecret();

	return useSession<UserData>({
		name: "app-session",
		password: SESSION_SECRET,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 24 * 30, // => 30 Days
		},
	});
}
