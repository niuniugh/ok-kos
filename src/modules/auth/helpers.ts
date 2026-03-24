import { prisma } from "@/lib/prisma";

export async function getOwnerById(ownerId: string) {
	const owner = await prisma.owner.findUnique({
		where: { id: ownerId },
		select: { id: true, name: true, email: true, plan: true },
	});
	if (!owner) throw new Error("Owner not found");
	return owner;
}

export async function verifyPropertyOwnership(
	ownerId: string,
	propertyId: string,
) {
	const property = await prisma.property.findFirst({
		where: { id: propertyId, ownerId },
		select: { id: true, name: true },
	});
	if (!property) throw new Error("Property not found");
	return property;
}
