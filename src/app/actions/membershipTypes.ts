"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Brak uprawnień administratora");
  }
}

export async function getMembershipTypes() {
  return await prisma.membershipType.findMany({
    where: {
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createMembershipType(formData: FormData) {
  await assertAdmin();

  const name = formData.get("name") as string;
  const scope = formData.get("scope") as string;
  const type = formData.get("type") as string;
  const price = parseFloat(formData.get("price") as string);
  const daysValid = formData.get("daysValid")
    ? parseInt(formData.get("daysValid") as string)
    : null;
  const entries = formData.get("entries")
    ? parseInt(formData.get("entries") as string)
    : null;

  if (!name || !scope || !type || isNaN(price)) {
    throw new Error("Please fill in all required fields");
  }

  if (type === "TIME" && !daysValid) {
    throw new Error("Time-based memberships require days validity");
  }

  if (type === "ENTRY" && !entries) {
    throw new Error("Entry-based memberships require number of entries");
  }

  await prisma.membershipType.create({
    data: {
      name,
      scope,
      type,
      price,
      daysValid,
      entries,
    },
  });

  revalidatePath("/admin/memberships");
}

export async function deleteMembershipType(id: string) {
  await assertAdmin();

  const linkedMemberships = await prisma.membership.count({
    where: { typeId: id },
  });

  if (linkedMemberships > 0) {
    throw new Error("Nie można usunąć karnetu, który był już sprzedany.");
  }

  await prisma.membershipType.delete({
    where: { id },
  });

  revalidatePath("/admin/memberships");
}
