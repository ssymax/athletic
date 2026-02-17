'use server';

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function login(formData: FormData) {
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
                    return { error: "Błędny login lub hasło" };
                default:
                    return { error: "Coś poszło nie tak" };
            }
        }
        throw error;
    }
}

export async function logout() {
    await signOut({ redirectTo: "/login" });
}
