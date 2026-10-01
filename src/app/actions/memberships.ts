"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  addDays,
  daysLeft,
  EXPIRY_REMINDER_DAYS,
  isMembershipExpired,
  LAPSED_REMINDER_DAYS,
  resolveDaysValid,
  startOfDay,
} from "@/lib/memberships";

// Sets to EXPIRED all memberships that are formally still ACTIVE but whose
// expiry date has passed or whose entries have run out. Called on every read
// of membership lists so the status never lies.
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

// Memberships ending within the next `days` days (including today).
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

// Members who have had no valid membership for 1 to `days` days.
// The last valid day is the membership end date or — when entries ran out
// before that date — the day of automatic expiration.
export async function getLapsedMembers(days = LAPSED_REMINDER_DAYS) {
  await expireOutdatedMemberships();

  const today = startOfDay(new Date());
  const since = addDays(today, -days);

  const memberships = await prisma.membership.findMany({
    where: {
      status: "EXPIRED",
      member: {
        is: { active: true, memberships: { none: { status: "ACTIVE" } } },
      },
      OR: [
        { endDate: { gte: since, lt: today } },
        { history: { some: { action: "EXPIRE", date: { gte: since } } } },
      ],
    },
    include: {
      member: true,
      type: true,
      history: {
        where: { action: "EXPIRE" },
        orderBy: { date: "desc" },
        take: 1,
      },
    },
  });

  const latestByMember = new Map<
    string,
    { membership: (typeof memberships)[number]; lastValidDay: Date }
  >();

  for (const membership of memberships) {
    const lastValidDay =
      membership.endDate && membership.endDate < today
        ? membership.endDate
        : membership.history[0]?.date;
    if (!lastValidDay) continue;

    const current = latestByMember.get(membership.memberId);
    if (!current || lastValidDay > current.lastValidDay) {
      latestByMember.set(membership.memberId, { membership, lastValidDay });
    }
  }

  return [...latestByMember.values()]
    .map(({ membership, lastValidDay }) => ({
      ...membership,
      lastValidDay,
      daysWithout: -(daysLeft(lastValidDay, today) ?? 0),
    }))
    .filter((lapsed) => lapsed.daysWithout >= 1 && lapsed.daysWithout <= days)
    .sort((a, b) => a.daysWithout - b.daysWithout);
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

  // A membership past its end date (or without entries) cannot be saved as active.
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
