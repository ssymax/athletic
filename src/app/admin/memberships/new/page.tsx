import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewMembershipTypeForm from "./NewMembershipTypeForm";

export default async function NewMembershipTypePage() {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return <NewMembershipTypeForm />;
}
