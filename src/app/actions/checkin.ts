"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isMembershipExpired, isMembershipValid } from "@/lib/memberships";
import { expireOutdatedMemberships } from "@/app/actions/memberships";

export async function findMemberForCheckin(query: string) {
  await expireOutdatedMemberships();

  const orConditions: object[] = [
    { phoneNumber: { contains: query, mode: "insensitive" } },
    { firstName: { contains: query, mode: "insensitive" } },
    { lastName: { contains: query, mode: "insensitive" } },
  ];

  if (query.includes(" ")) {
    const parts = query.trim().split(/\s+/);
    const first = parts[0];
    const last = parts.slice(1).join(" ");
    orConditions.push(
      {
        AND: [
          { firstName: { contains: first, mode: "insensitive" } },
          { lastName: { contains: last, mode: "insensitive" } },
        ],
      },
      {
        AND: [
          { firstName: { contains: last, mode: "insensitive" } },
          { lastName: { contains: first, mode: "insensitive" } },
        ],
      },
    );
  }

  const members = await prisma.member.findMany({
    where: {
      OR: orConditions,
      active: true,
    },
    include: {
      memberships: {
        where: { status: "ACTIVE" }, // Only fetch active memberships
        include: { type: true },
      },
    },
    take: 5,
  });

  return members.map((member) => ({
    ...member,
    memberships: member.memberships.filter((membership) =>
      isMembershipValid(membership),
    ),
  }));
}

export async function registerVisit(memberId: string, membershipId: string) {
  const t = await getTranslations("checkin");
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { type: true },
  });

  if (!membership || membership.status !== "ACTIVE") {
    return { success: false, message: t("errors.invalidMembership") };
  }

  // Check validity — the end date itself is still valid.
  if (
    membership.endDate &&
    isMembershipExpired({
      endDate: membership.endDate,
      remainingEntries: null,
      type: { type: "TIME" },
    })
  ) {
    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: "EXPIRED",
        history: {
          create: {
            action: "EXPIRE",
            details: "Auto-expired during check-in attempt",
          },
        },
      },
    });
    return { success: false, message: t("errors.expired") };
  }

  if (membership.type.type === "ENTRY") {
    if (
      membership.remainingEntries !== null &&
      membership.remainingEntries <= 0
    ) {
      return { success: false, message: t("errors.noEntries") };
    }

    // The last entry uses up the membership — set EXPIRED right away,
    // so the member isn't left with an "active" status without cover.
    const isLastEntry = membership.remainingEntries === 1;

    // Deduct entry
    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        remainingEntries: { decrement: 1 },
        ...(isLastEntry ? { status: "EXPIRED" } : {}),
        history: {
          create: { action: "USE_ENTRY", details: "Visit registered" },
        },
      },
    });

    if (isLastEntry) {
      await prisma.membershipHistory.create({
        data: {
          membershipId,
          action: "EXPIRE",
          details: "Automatyczne wygaśnięcie: wykorzystano ostatnie wejście",
        },
      });
    }
  } else {
    // Time based - just log
    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        history: {
          create: { action: "USE_ENTRY", details: "Visit registered" },
        },
      },
    });
  }

  revalidatePath("/checkin");
  revalidatePath(`/members/${memberId}`);
  return { success: true, message: t("visitRegistered") };
}
