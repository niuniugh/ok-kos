import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { useAppSession } from "../sessions/appSession";
import { LoginSchema, RegisterSchema } from "./schema";

// ================= LOGIN =================
export const loginFn = createServerFn({ method: "POST" })
	.inputValidator(LoginSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession(); // ← dipanggil di level atas

		try {
			console.log("LOGIN DATA:", data);

			const user = await prisma.owner.findUnique({
				where: { email: data.email },
			});

			console.log("USER:", user);

			if (!user) {
				throw new Error("Invalid email or password");
			}

			const isValidPassword = await bcrypt.compare(
				data.password,
				user.passwordHash,
			);

			console.log("PASSWORD VALID:", isValidPassword);

			if (!isValidPassword) {
				throw new Error("Invalid email or password");
			}

			await session.update({
				id: user.id,
				name: user.name,
				email: user.email,
				plan: user.plan,
			});
		} catch (err) {
			console.error("LOGIN ERROR:", err);
			throw err;
		}
	});

// ================= LOGOUT =================
export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
	const session = await useAppSession(); // ← dipanggil di level atas
	await session.clear();
});

// ================= REGISTER =================
export const registerFn = createServerFn({ method: "POST" })
	.inputValidator(RegisterSchema)
	.handler(async ({ data }) => {
		const session = await useAppSession(); // ← dipanggil di level atas

		const existingUser = await prisma.owner.findUnique({
			where: { email: data.email },
		});

		if (existingUser) {
			throw new Error("Email already registered");
		}

		const hashedPassword = await bcrypt.hash(data.password, 10);

		const user = await prisma.owner.create({
			data: {
				email: data.email,
				name: data.name,
				passwordHash: hashedPassword,
			},
		});

		await session.update({
			id: user.id,
			name: user.name,
			email: user.email,
			plan: user.plan,
		});
	});
