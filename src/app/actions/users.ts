"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { getTranslations } from "next-intl/server";

const VALID_ROLES = ["ADMIN", "RECEPTION"] as const;
type UserRole = (typeof VALID_ROLES)[number];

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    const t = await getTranslations("users");
    throw new Error(t("errors.adminRequired"));
  }
}

async function parseRole(role: string): Promise<UserRole> {
  if (VALID_ROLES.includes(role as UserRole)) {
    return role as UserRole;
  }
  const t = await getTranslations("users");
  throw new Error(t("errors.invalidRole"));
}

async function ensureNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    const t = await getTranslations("users");
    throw new Error(t("errors.required", { label }));
  }
}

export async function getUsers() {
  await assertAdmin();

  return await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getUserById(id: string) {
  await assertAdmin();

  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createUser(formData: FormData) {
  await assertAdmin();

  const username = (formData.get("username") as string) || "";
  const password = (formData.get("password") as string) || "";
  const roleRaw = (formData.get("role") as string) || "";
  const t = await getTranslations("users");

  await ensureNonEmpty(username, t("fields.username"));
  await ensureNonEmpty(password, t("fields.password"));

  if (password.length < 6) {
    throw new Error(t("errors.passwordTooShort"));
  }

  const role = await parseRole(roleRaw);
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        role,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new Error(t("errors.duplicate"));
    }
    throw error;
  }

  revalidatePath("/admin/users");
}

export async function updateUser(id: string, formData: FormData) {
  await assertAdmin();

  const username = (formData.get("username") as string) || "";
  const password = (formData.get("password") as string) || "";
  const roleRaw = (formData.get("role") as string) || "";

  const t = await getTranslations("users");

  await ensureNonEmpty(username, t("fields.username"));
  const role = await parseRole(roleRaw);

  const data: {
    username: string;
    role: UserRole;
    password?: string;
  } = {
    username: username.trim(),
    role,
  };

  if (password.trim()) {
    if (password.length < 6) {
      throw new Error(t("errors.passwordTooShort"));
    }
    data.password = await bcrypt.hash(password, 10);
  }

  try {
    await prisma.user.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new Error(t("errors.duplicate"));
    }
    throw error;
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}/edit`);
}
