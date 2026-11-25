"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import {
  type ActionResult,
  actionError,
  isUniqueConstraintError,
} from "@/lib/actionResult";

const VALID_ROLES = ["ADMIN", "RECEPTION"] as const;
type UserRole = (typeof VALID_ROLES)[number];

const USERNAME_REQUIRED_ERROR = "Login jest wymagany";
const PASSWORD_REQUIRED_ERROR = "Hasło jest wymagane";
const PASSWORD_TOO_SHORT_ERROR = "Hasło musi mieć minimum 6 znaków";
const INVALID_ROLE_ERROR = "Nieprawidłowa rola użytkownika";
const DUPLICATE_USERNAME_ERROR = "Użytkownik o takim loginie już istnieje";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Brak uprawnień administratora");
  }
}

function parseRole(role: string): UserRole | null {
  return VALID_ROLES.find((validRole) => validRole === role) ?? null;
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

export async function createUser(formData: FormData): Promise<ActionResult> {
  await assertAdmin();

  const username = (formData.get("username") as string) || "";
  const password = (formData.get("password") as string) || "";
  const roleRaw = (formData.get("role") as string) || "";

  if (!username.trim()) return actionError(USERNAME_REQUIRED_ERROR);
  if (!password.trim()) return actionError(PASSWORD_REQUIRED_ERROR);
  if (password.length < 6) return actionError(PASSWORD_TOO_SHORT_ERROR);

  const role = parseRole(roleRaw);
  if (!role) return actionError(INVALID_ROLE_ERROR);

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
    if (isUniqueConstraintError(error)) {
      return actionError(DUPLICATE_USERNAME_ERROR);
    }
    throw error;
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUser(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const username = (formData.get("username") as string) || "";
  const password = (formData.get("password") as string) || "";
  const roleRaw = (formData.get("role") as string) || "";

  if (!username.trim()) return actionError(USERNAME_REQUIRED_ERROR);

  const role = parseRole(roleRaw);
  if (!role) return actionError(INVALID_ROLE_ERROR);

  const data: {
    username: string;
    role: UserRole;
    password?: string;
  } = {
    username: username.trim(),
    role,
  };

  if (password.trim()) {
    if (password.length < 6) return actionError(PASSWORD_TOO_SHORT_ERROR);
    data.password = await bcrypt.hash(password, 10);
  }

  try {
    await prisma.user.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError(DUPLICATE_USERNAME_ERROR);
    }
    throw error;
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}/edit`);
  return { success: true };
}
