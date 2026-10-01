"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { resolveDaysValid } from "@/lib/memberships";
import { getTranslations } from "next-intl/server";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    const t = await getTranslations("membershipTypes");
    throw new Error(t("errors.adminRequired"));
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
  const t = await getTranslations("membershipTypes");

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
    throw new Error(t("errors.requiredFields"));
  }

  if (type === "TIME" && !daysValidInput) {
    throw new Error(t("errors.timeNeedsDays"));
  }

  if (type === "ENTRY" && !entries) {
    throw new Error(t("errors.entryNeedsEntries"));
  }

  // Entry-based memberships also have a validity in days — 30 days by default.
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
}

export async function deleteMembershipType(id: string) {
  await assertAdmin();
  const t = await getTranslations("membershipTypes");

  const linkedMemberships = await prisma.membership.count({
    where: { typeId: id },
  });

  if (linkedMemberships > 0) {
    throw new Error(t("errors.inUse"));
  }

  await prisma.membershipType.delete({
    where: { id },
  });

  revalidatePath("/admin/memberships");
}
