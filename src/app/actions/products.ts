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

export async function getProducts(query?: string) {
  const where = {
    active: true,
    ...(query ? { name: { contains: query } } : {}),
  };

  return await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
  });
}

export async function createProduct(formData: FormData) {
  await assertAdmin();

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string) || 0;

  if (!name || !category || isNaN(price)) {
    throw new Error("Please fill in all required fields");
  }

  await prisma.product.create({
    data: {
      name,
      category,
      price,
      stock,
    },
  });

  revalidatePath("/products");
  return { success: true };
}

export async function updateStock(id: string, amount: number) {
  await assertAdmin();

  await prisma.product.update({
    where: { id },
    data: { stock: { increment: amount } },
  });
  revalidatePath("/products");
}

export async function setStock(id: string, stock: number) {
  await assertAdmin();

  await prisma.product.update({
    where: { id },
    data: { stock },
  });
  revalidatePath("/products");
}

export async function deleteProduct(id: string) {
  await assertAdmin();

  await prisma.product.update({
    where: { id },
    data: { active: false },
  });

  revalidatePath("/products");
  revalidatePath("/pos");
}
