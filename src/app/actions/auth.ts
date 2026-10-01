"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";

export async function login(formData: FormData) {
  const t = await getTranslations("auth");
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: t("invalidCredentials") };
        default:
          return { error: t("genericError") };
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
