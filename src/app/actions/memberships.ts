"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  addDays,
  EXPIRY_REMINDER_DAYS,
  isMembershipExpired,
  resolveDaysValid,
  startOfDay,
} from "@/lib/memberships";

// Przestawia na EXPIRED wszystkie karnety, które formalnie są jeszcze ACTIVE,
// ale minęła ich data ważności lub skończyły się wejścia. Wywoływane przy
// każdym odczycie list karnetów, żeby status nigdy nie kłamał.
export async function expireOutdatedMemberships() {
  const today = startOfDay(new Date());

  const outdated = await prisma.membership.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { endDate: { lt: today } },
        {
          remainingEntries: { lte: 0 },
          type: { is: { type: "ENTRY" } },
        },
      ],
    },
    select: { id: true, endDate: true, remainingEntries: true },
  });

  if (outdated.length === 0) return 0;

  await prisma.$transaction([
    prisma.membership.updateMany({
      where: { id: { in: outdated.map((membership) => membership.id) } },
      data: { status: "EXPIRED" },
    }),
    prisma.membershipHistory.createMany({
      data: outdated.map((membership) => ({
        membershipId: membership.id,
        action: "EXPIRE",
        details:
          membership.endDate && membership.endDate < today
            ? "Automatyczne wygaśnięcie: minęła data ważności"
            : "Automatyczne wygaśnięcie: brak pozostałych wejść",
      })),
    }),
  ]);

  return outdated.length;
}

// Karnety, które kończą się w ciągu najbliższych `days` dni (włącznie z dziś).
export async function getExpiringMemberships(days = EXPIRY_REMINDER_DAYS) {
  await expireOutdatedMemberships();

  const today = startOfDay(new Date());
  const until = addDays(today, days + 1);

  return await prisma.membership.findMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: today, lt: until },
      member: { is: { active: true } },
    },
    include: { member: true, type: true },
    orderBy: { endDate: "asc" },
  });
}

export async function getMembership(id: string) {
  return await prisma.membership.findUnique({
    where: { id },
    include: { type: true },
  });
}

export async function updateMembership(
  membershipId: string,
  memberId: string,
  formData: FormData,
) {
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const remainingEntriesStr = formData.get("remainingEntries") as string;
  const status = formData.get("status") as string;
  const paymentMethod = formData.get("paymentMethod") as string;
  const pricePaidStr = formData.get("pricePaid") as string;
  const note = formData.get("note") as string;

  const startDate = new Date(startDateStr);
  const endDate = endDateStr ? new Date(endDateStr) : null;
  const remainingEntries = remainingEntriesStr
    ? parseInt(remainingEntriesStr)
    : null;
  const pricePaid = parseFloat(pricePaidStr);

  const existing = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { type: true },
  });

  if (!existing) throw new Error("Nie znaleziono karnetu");

  // Karnet po terminie (lub bez wejść) nie może zostać zapisany jako aktywny.
  if (
    status === "ACTIVE" &&
    isMembershipExpired({ endDate, remainingEntries, type: existing.type })
  ) {
    throw new Error(
      "Karnet po terminie ważności lub bez pozostałych wejść nie może mieć statusu Aktywny. Zmień datę zakończenia / liczbę wejść albo ustaw status Wygasły.",
    );
  }

  await prisma.membership.update({
    where: { id: membershipId },
    data: {
      startDate,
      endDate,
      remainingEntries,
      status,
      paymentMethod,
      pricePaid,
      note,
      history: {
        create: {
          action: "EDIT",
          details: `Edycja karnetu przez obsługę`,
        },
      },
    },
  });

  revalidatePath(`/members/${memberId}`);
  return { success: true };
}

export async function sellMembership(memberId: string, formData: FormData) {
  const typeId = formData.get("typeId") as string;
  const startDateStr = formData.get("startDate") as string;
  const paymentMethod = formData.get("paymentMethod") as string;
  const discountStr = formData.get("discount") as string;

  if (!typeId || !startDateStr || !paymentMethod) {
    throw new Error("Missing required fields");
  }

  const membershipType = await prisma.membershipType.findUnique({
    where: { id: typeId },
  });

  if (!membershipType) throw new Error("Invalid membership type");

  const startDate = new Date(startDateStr);
  let endDate: Date | null = null;
  let remainingEntries: number | null = null;

  const daysValid = resolveDaysValid(
    membershipType.type,
    membershipType.daysValid,
  );

  if (membershipType.type === "ENTRY") {
    remainingEntries = membershipType.entries ?? null;
  }

  if (daysValid) {
    endDate = addDays(startDate, daysValid);
  }

  const discount = discountStr ? parseFloat(discountStr) : 0;
  const pricePaid = Math.max(0, membershipType.price - discount);

  const details =
    discount > 0
      ? `Karnet: ${membershipType.name} - ${membershipType.price} PLN (rabat: ${discount} PLN, zapłacono: ${pricePaid} PLN)`
      : `Karnet: ${membershipType.name} - ${membershipType.price} PLN`;

  await prisma.membership.create({
    data: {
      memberId,
      typeId,
      startDate,
      endDate,
      remainingEntries,
      status: "ACTIVE",
      paymentMethod,
      pricePaid,
      history: {
        create: {
          action: "PURCHASE",
          details,
        },
      },
    },
  });

  revalidatePath(`/members/${memberId}`);
  return { success: true };
}
