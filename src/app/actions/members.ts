"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

function pickPrimaryMembershipForList(
  memberships: {
    id: string;
    type: { type: string; name: string };
    startDate: Date;
    endDate: Date | null;
    remainingEntries: number | null;
  }[],
) {
  if (memberships.length === 0) return null;

  const timeBased = memberships.filter(
    (membership) => membership.type.type === "TIME",
  );
  if (timeBased.length > 0) {
    return [...timeBased].sort((a, b) => {
      const aEnd = a.endDate ? a.endDate.getTime() : Number.POSITIVE_INFINITY;
      const bEnd = b.endDate ? b.endDate.getTime() : Number.POSITIVE_INFINITY;

      if (aEnd !== bEnd) return aEnd - bEnd;
      return b.startDate.getTime() - a.startDate.getTime();
    })[0];
  }

  const entryBased = memberships.filter(
    (membership) => membership.type.type === "ENTRY",
  );
  if (entryBased.length > 0) {
    return [...entryBased].sort((a, b) => {
      const aEntries = a.remainingEntries ?? Number.POSITIVE_INFINITY;
      const bEntries = b.remainingEntries ?? Number.POSITIVE_INFINITY;

      if (aEntries !== bEntries) return aEntries - bEntries;
      return b.startDate.getTime() - a.startDate.getTime();
    })[0];
  }

  return [...memberships].sort(
    (a, b) => b.startDate.getTime() - a.startDate.getTime(),
  )[0];
}

export async function getMembers(query?: string) {
  const where = query
    ? {
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { phoneNumber: { contains: query } },
        ],
      }
    : {};

  const members = await prisma.member.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: { type: true },
        orderBy: { startDate: "desc" },
      },
    },
  });

  return members.map((member) => {
    const primaryMembership = pickPrimaryMembershipForList(member.memberships);
    return {
      ...member,
      primaryMembership,
    };
  });
}

export async function createMember(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const notes = formData.get("notes") as string;

  if (!firstName || !lastName || !phoneNumber) {
    throw new Error("Please fill in all required fields");
  }

  await prisma.member.create({
    data: {
      firstName,
      lastName,
      phoneNumber,
      notes,
    },
  });

  revalidatePath("/members");
  return { success: true };
}

export async function updateMember(id: string, formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const notes = formData.get("notes") as string;
  const active = formData.get("active") === "on";

  await prisma.member.update({
    where: { id },
    data: {
      firstName,
      lastName,
      phoneNumber,
      notes,
      active,
    },
  });

  revalidatePath("/members");
  return { success: true };
}

export async function getMember(id: string) {
  return await prisma.member.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          type: true,
        },
        orderBy: {
          startDate: "desc",
        },
      },
    },
  });
}

export async function deleteMember(id: string) {
  const memberships = await prisma.membership.findMany({
    where: { memberId: id },
    select: { id: true },
  });

  const membershipIds = memberships.map((membership) => membership.id);

  await prisma.$transaction(async (tx) => {
    if (membershipIds.length > 0) {
      await tx.membershipHistory.deleteMany({
        where: {
          membershipId: {
            in: membershipIds,
          },
        },
      });
    }

    await tx.membership.deleteMany({
      where: { memberId: id },
    });

    await tx.member.delete({
      where: { id },
    });
  });

  revalidatePath("/members");
  revalidatePath("/checkin");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}
