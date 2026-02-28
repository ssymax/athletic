import { getMembershipTypes } from "@/app/actions/membershipTypes";
import Link from "next/link";
import { DeleteMembershipTypeButton } from "./components/DeleteMembershipTypeButton";
import { Button } from "@/components/ui/Button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function MembershipTypesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const types = await getMembershipTypes();

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1>Definicje Karnetów</h1>
        <Link href="/admin/memberships/new">
          <Button>Dodaj Typ Karnetu</Button>
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Typ</th>
                <th>Ważność</th>
                <th>Cena</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {types.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    Brak zdefiniowanych karnetów.
                  </td>
                </tr>
              ) : (
                types.map((type) => (
                  <tr key={type.id}>
                    <td className="font-medium">{type.name}</td>
                    <td>{type.type === "TIME" ? "Czasowy" : "Wejściowy"}</td>
                    <td>
                      {type.type === "TIME"
                        ? `${type.daysValid} dni`
                        : `${type.entries} wejść`}
                    </td>
                    <td className="font-semibold">
                      {type.price.toFixed(2)} zł
                    </td>
                    <td>
                      <DeleteMembershipTypeButton
                        id={type.id}
                        name={type.name}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
