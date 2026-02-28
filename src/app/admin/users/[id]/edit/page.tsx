import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getUserById } from "@/app/actions/users";
import EditUserForm from "./EditUserForm";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  return <EditUserForm user={user} />;
}
