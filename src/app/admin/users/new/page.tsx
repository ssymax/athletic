import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewUserForm from "./NewUserForm";

export default async function NewUserPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <NewUserForm />;
}
