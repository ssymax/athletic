import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewProductForm from "./NewProductForm";

export default async function NewProductPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/pos");
  }

  return <NewProductForm />;
}
