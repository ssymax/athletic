"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

interface CartItem {
  productId: string;
  quantity: number;
  price: number; // snapshot price
}

export async function processSale(
  items: CartItem[],
  paymentMethod: string,
  note?: string,
) {
  if (items.length === 0) {
    throw new Error("Cart is empty");
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Use transaction to ensure data integrity
  await prisma.$transaction(async (tx) => {
    // Create Sale
    await tx.sale.create({
      data: {
        paymentMethod,
        totalAmount,
        note,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity,
          })),
        },
      },
    });

    // Update Stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });

  revalidatePath("/pos");
  revalidatePath("/products");
  revalidatePath("/dashboard"); // If dashboard shows sales
  return { success: true };
}
