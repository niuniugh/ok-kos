import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { PrismaClient } from "generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
	const passwordHash = await bcrypt.hash("demo123", 10);

	const owner = await prisma.owner.upsert({
		where: { email: "demo@demo.com" },
		update: {},
		create: {
			email: "demo@demo.com",
			passwordHash,
			name: "Demo Owner",
			plan: "paid",
		},
	});

	const property1 = await prisma.property.create({
		data: {
			ownerId: owner.id,
			name: "Kos Melati",
			address: "Jl. Melati No. 15, Jakarta Selatan",
			rooms: {
				create: [
					{ roomNumber: "101", rentPrice: 1500000, status: "occupied" },
					{ roomNumber: "102", rentPrice: 1500000, status: "occupied" },
					{ roomNumber: "103", rentPrice: 1200000, status: "vacant" },
				],
			},
		},
	});

	const property2 = await prisma.property.create({
		data: {
			ownerId: owner.id,
			name: "Kos Mawar",
			address: "Jl. Mawar No. 8, Jakarta Barat",
			rooms: {
				create: [
					{ roomNumber: "A1", rentPrice: 1800000, status: "occupied" },
					{ roomNumber: "A2", rentPrice: 1800000, status: "vacant" },
					{ roomNumber: "B1", rentPrice: 2000000, status: "vacant" },
				],
			},
		},
	});

	const rooms = await prisma.room.findMany({
		where: { propertyId: { in: [property1.id, property2.id] } },
	});

	const room101 = rooms.find((r) => r.roomNumber === "101");
	const room102 = rooms.find((r) => r.roomNumber === "102");
	const roomA1 = rooms.find((r) => r.roomNumber === "A1");

	if (!room101 || !room102 || !roomA1) {
		throw new Error("Failed to create rooms");
	}

	const tenant1 = await prisma.tenant.create({
		data: {
			roomId: room101.id,
			name: "Ahmad Fauzi",
			phone: "081234567890",
			moveInDate: new Date("2024-01-15"),
			status: "active",
		},
	});

	const tenant2 = await prisma.tenant.create({
		data: {
			roomId: room102.id,
			name: "Siti Aminah",
			phone: "081234567891",
			moveInDate: new Date("2024-03-01"),
			status: "active",
		},
	});

	const tenant3 = await prisma.tenant.create({
		data: {
			roomId: roomA1.id,
			name: "Budi Santoso",
			phone: "081234567892",
			moveInDate: new Date("2023-06-01"),
			moveOutDate: new Date("2024-06-30"),
			status: "inactive",
		},
	});

	const months = [
		"2024-01",
		"2024-02",
		"2024-03",
		"2024-04",
		"2024-05",
		"2024-06",
		"2024-07",
		"2024-08",
		"2024-09",
		"2024-10",
		"2024-11",
		"2024-12",
	];

	for (const month of months) {
		const due = month === "2024-06" ? 1200000 : 1500000;
		const paid = month === "2024-12" ? 0 : due;
		const status = month === "2024-12" ? "unpaid" : "paid";

		await prisma.payment.create({
			data: {
				tenantId: tenant1.id,
				month,
				amountDue: due,
				amountPaid: paid,
				status,
				paidAt: paid > 0 ? new Date(`${month}-15`) : null,
			},
		});
	}

	for (const month of months) {
		const due = month === "2024-12" ? 1500000 : 1500000;
		const paid = month === "2024-12" ? 500000 : due;
		const status = month === "2024-12" ? "partial" : "paid";

		await prisma.payment.create({
			data: {
				tenantId: tenant2.id,
				month,
				amountDue: due,
				amountPaid: paid,
				status,
				paidAt: paid > 0 ? new Date(`${month}-20`) : null,
			},
		});
	}

	const inactiveMonths = [
		"2024-01",
		"2024-02",
		"2024-03",
		"2024-04",
		"2024-05",
		"2024-06",
	];
	for (const month of inactiveMonths) {
		await prisma.payment.create({
			data: {
				tenantId: tenant3.id,
				month,
				amountDue: 1800000,
				amountPaid: 1800000,
				status: "paid",
				paidAt: new Date(`${month}-10`),
			},
		});
	}

	console.log("Seed completed!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
