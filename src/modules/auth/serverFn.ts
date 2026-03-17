import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { useAppSession } from "../sessions/appSession";
import { LoginSchema, RegisterSchema } from "./schema";

export const loginFn = createServerFn({ method: "POST" })
	.inputValidator(LoginSchema)
	.handler(async ({ data }) => {
		const user = await prisma.user.findUnique({
			where: { email: data.email },
		});

		if (!user) {
			throw new Error("Invalid email or password");
		}

		const isValidPassword = await bcrypt.compare(data.password, user.password);

		if (!isValidPassword) {
			throw new Error("Invalid email or password");
		}

		const session = await useAppSession();
		await session.update({
			id: user.id,
			name: user.name,
			email: user.email,
		});
	});

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
	const session = await useAppSession();
	await session.clear();
});

export const registerFn = createServerFn({ method: "POST" })
	.inputValidator(RegisterSchema)
	.handler(async ({ data }) => {
		const existingUser = await prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existingUser) {
			throw new Error("Email already registered");
		}

		const hashedPassword = await bcrypt.hash(data.password, 10);

		const user = await prisma.user.create({
			data: {
				email: data.email,
				name: data.name,
				password: hashedPassword,
			},
		});

		const session = await useAppSession();
		await session.update({
			id: user.id,
			name: user.name,
			email: user.email,
		});
	});
