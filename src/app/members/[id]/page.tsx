import { getMember } from "@/app/actions/members";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteMemberButton } from "./components/DeleteMemberButton";

export default async function MemberDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMember(id);

  if (!member) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/members"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Wróć
        </Link>
        <h1 className="text-2xl font-bold">
          {member.firstName} {member.lastName}
        </h1>
        <span
          className={`badge ${member.active ? "badge-success" : "badge-danger"}`}
        >
          {member.active ? "Aktywny" : "Nieaktywny"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Dane Klubowicza</h2>
            <div className="space-y-3">
              <div>
                <span className="label text-muted-foreground">
                  Numer telefonu
                </span>
                <p className="font-medium">{member.phoneNumber}</p>
              </div>
              <div>
                <span className="label text-muted-foreground">Notatki</span>
                <p className="whitespace-pre-wrap">{member.notes || "-"}</p>
              </div>
              <div className="pt-4 flex gap-2">
                <Link
                  href={`/members/${id}/edit`}
                  className="btn btn-outline w-full"
                >
                  Edytuj dane
                </Link>
              </div>
              <div className="pt-2">
                <DeleteMemberButton
                  id={member.id}
                  fullName={`${member.firstName} ${member.lastName}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Karnety</h2>
              <Link
                href={`/members/${id}/memberships/new`}
                className="btn btn-primary btn-sm text-sm"
              >
                Sprzedaj Karnet
              </Link>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Typ</th>
                    <th>Data zakupu</th>
                    <th>Ważność</th>
                    <th>Status</th>
                    <th>Cena</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {member.memberships.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-4 text-muted-foreground"
                      >
                        Brak historii karnetów.
                      </td>
                    </tr>
                  ) : (
                    member.memberships.map((membership) => (
                      <tr key={membership.id}>
                        <td className="font-medium">{membership.type.name}</td>
                        <td>
                          {new Date(membership.purchaseDate).toLocaleDateString(
                            "pl-PL",
                          )}
                        </td>
                        <td>
                          {membership.type.type === "TIME" ? (
                            <>
                              {new Date(
                                membership.startDate,
                              ).toLocaleDateString("pl-PL")}{" "}
                              -{" "}
                              {membership.endDate
                                ? new Date(
                                    membership.endDate,
                                  ).toLocaleDateString("pl-PL")
                                : "?"}
                            </>
                          ) : (
                            <>
                              {membership.remainingEntries} wejść
                              {membership.endDate && (
                                <span className="text-muted-foreground text-xs ml-1">
                                  (do{" "}
                                  {new Date(
                                    membership.endDate,
                                  ).toLocaleDateString("pl-PL")}
                                  )
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${membership.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}
                          >
                            {membership.status}
                          </span>
                        </td>
                        <td>{membership.pricePaid.toFixed(2)} zł</td>
                        <td>
                          <Link
                            href={`/members/${id}/memberships/${membership.id}/edit`}
                            className="text-primary text-sm font-medium"
                          >
                            Edytuj
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
