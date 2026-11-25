"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { type ActionResult, actionError } from "@/lib/actionResult";
import { resolveDaysValid } from "@/lib/memberships";

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

export async function createMembershipType(
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const name = formData.get("name") as string;
  const scope = formData.get("scope") as string;
  const type = formData.get("type") as string;
  const price = parseFloat(formData.get("price") as string);
  const daysValidInput = formData.get("daysValid")
    ? parseInt(formData.get("daysValid") as string)
    : null;
  const entries = formData.get("entries")
    ? parseInt(formData.get("entries") as string)
    : null;

  if (!name || !scope || !type || isNaN(price)) {
    return actionError("Uzupełnij wszystkie wymagane pola");
  }

  if (type === "TIME" && !daysValidInput) {
    return actionError("Karnet czasowy wymaga liczby dni ważności");
  }

  if (type === "ENTRY" && !entries) {
    return actionError("Karnet wejściowy wymaga liczby wejść");
  }

  // Karnety wejściowe też mają ważność w dniach — domyślnie 30 dni.
  const daysValid = resolveDaysValid(type, daysValidInput);

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
  return { success: true };
}

export async function deleteMembershipType(id: string): Promise<ActionResult> {
  await assertAdmin();

  const linkedMemberships = await prisma.membership.count({
    where: { typeId: id },
  });

  if (linkedMemberships > 0) {
    return actionError("Nie można usunąć karnetu, który był już sprzedany.");
  }

  await prisma.membershipType.delete({
    where: { id },
  });

  revalidatePath("/admin/memberships");
  return { success: true };
}
