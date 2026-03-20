import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { useAppSession } from "../sessions/appSession";
import { LoginSchema, RegisterSchema } from "./schema";

export const loginFn = createServerFn({ method: "POST" })
	.inputValidator(LoginSchema)
	.handler(async ({ data }) => {
		const user = await prisma.owner.findUnique({
			where: { email: data.email },
		});

		if (!user) {
			throw new Error("Invalid email or password");
		}

		const isValidPassword = await bcrypt.compare(
			data.password,
			user.passwordHash,
		);

		if (!isValidPassword) {
			throw new Error("Invalid email or password");
		}

		const session = await useAppSession();
		await session.update({
			id: user.id,
			name: user.name,
			email: user.email,
			plan: user.plan,
		});
	});

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
	const session = await useAppSession();
	await session.clear();
});

export const registerFn = createServerFn({ method: "POST" })
	.inputValidator(RegisterSchema)
	.handler(async ({ data }) => {
		const existingUser = await prisma.owner.findUnique({
			where: { email: data.email },
		});

		if (existingUser) {
			throw new Error("Email already registered");
		}

		const BCRYPT_ROUNDS = 10;
	const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

		const user = await prisma.owner.create({
			data: {
				email: data.email,
				name: data.name,
				passwordHash: hashedPassword,
			},
		});

		const session = await useAppSession();
		await session.update({
			id: user.id,
			name: user.name,
			email: user.email,
			plan: user.plan,
		});
	});
