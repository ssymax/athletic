import { getMember } from "@/app/actions/members";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteMemberButton } from "./components/DeleteMemberButton";
import { daysLeft } from "@/lib/memberships";

const formatDate = (date: Date | string | null | undefined) =>
  date ? new Date(date).toLocaleDateString("pl-PL") : "-";

function validityLabel(endDate: Date | null) {
  const left = daysLeft(endDate);
  if (left === null) return "bezterminowo";
  if (left < 0) return `wygasł ${Math.abs(left)} dni temu`;
  if (left === 0) return "wygasa dziś";
  if (left === 1) return "został 1 dzień";
  return `zostało ${left} dni`;
}

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

  // Najbliżej wygasający aktywny karnet — to on interesuje obsługę na pierwszy rzut oka.
  const currentMembership =
    [...member.memberships]
      .filter((m) => m.status === "ACTIVE")
      .sort((a, b) => {
        const aEnd = a.endDate
          ? new Date(a.endDate).getTime()
          : Number.POSITIVE_INFINITY;
        const bEnd = b.endDate
          ? new Date(b.endDate).getTime()
          : Number.POSITIVE_INFINITY;
        if (aEnd !== bEnd) return aEnd - bEnd;
        return (
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      })[0] ?? null;

  return (
    <div className="container-wide mx-auto py-8">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="card">
            <h2 className="text-base font-semibold mb-3">Dane Klubowicza</h2>
            <div className="space-y-2 text-sm">
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
              <div className="pt-3 flex gap-2">
                <Link
                  href={`/members/${id}/edit`}
                  className="btn btn-outline w-full"
                >
                  Edytuj dane
                </Link>
              </div>
              <div className="pt-1">
                <DeleteMemberButton
                  id={member.id}
                  fullName={`${member.firstName} ${member.lastName}`}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold mb-3">Aktualny karnet</h2>
            {currentMembership ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="label text-muted-foreground">Typ</span>
                  <p className="font-medium">{currentMembership.type.name}</p>
                </div>
                <div>
                  <span className="label text-muted-foreground">
                    Data zakupu
                  </span>
                  <p className="font-medium">
                    {formatDate(currentMembership.purchaseDate)}
                  </p>
                </div>
                <div>
                  <span className="label text-muted-foreground">
                    Data rozpoczęcia
                  </span>
                  <p className="font-medium">
                    {formatDate(currentMembership.startDate)}
                  </p>
                </div>
                <div>
                  <span className="label text-muted-foreground">Ważny do</span>
                  <p className="font-medium">
                    {formatDate(currentMembership.endDate)}{" "}
                    <span className="text-muted-foreground text-sm">
                      ({validityLabel(currentMembership.endDate)})
                    </span>
                  </p>
                </div>
                {currentMembership.type.type === "ENTRY" && (
                  <div>
                    <span className="label text-muted-foreground">
                      Pozostałe wejścia
                    </span>
                    <p className="font-medium">
                      {currentMembership.remainingEntries ?? "-"}
                      {currentMembership.type.entries
                        ? ` z ${currentMembership.type.entries}`
                        : ""}
                    </p>
                  </div>
                )}
                <div>
                  <span className="label text-muted-foreground">Zapłacono</span>
                  <p className="font-medium">
                    {currentMembership.pricePaid.toFixed(2)} zł (
                    {currentMembership.paymentMethod === "CASH"
                      ? "gotówka"
                      : "karta"}
                    )
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Brak aktywnego karnetu.</p>
            )}
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
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
                    <th>Okres ważności</th>
                    <th>Pozostało</th>
                    <th>Status</th>
                    <th>Cena</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {member.memberships.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-4 text-muted-foreground"
                      >
                        Brak historii karnetów.
                      </td>
                    </tr>
                  ) : (
                    member.memberships.map((membership) => (
                      <tr key={membership.id}>
                        <td className="font-medium">{membership.type.name}</td>
                        <td className="whitespace-nowrap">
                          {formatDate(membership.purchaseDate)}
                        </td>
                        <td className="whitespace-nowrap">
                          {formatDate(membership.startDate)} -{" "}
                          {membership.endDate
                            ? formatDate(membership.endDate)
                            : "bezterminowo"}
                        </td>
                        <td className="whitespace-nowrap">
                          {membership.type.type === "ENTRY" && (
                            <div>{membership.remainingEntries} wejść</div>
                          )}
                          {membership.status === "ACTIVE" &&
                            membership.endDate && (
                              <div className="text-muted-foreground text-xs">
                                {validityLabel(membership.endDate)}
                              </div>
                            )}
                        </td>
                        <td>
                          <span
                            className={`badge ${membership.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}
                          >
                            {membership.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap">
                          {membership.pricePaid.toFixed(2)} zł
                        </td>
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
