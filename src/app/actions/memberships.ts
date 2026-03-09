"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

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

  if (membershipType.type === "TIME" && membershipType.daysValid) {
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + membershipType.daysValid);
  } else if (membershipType.type === "ENTRY") {
    remainingEntries = membershipType.entries ?? null;
    if (membershipType.daysValid) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + membershipType.daysValid);
    }
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
