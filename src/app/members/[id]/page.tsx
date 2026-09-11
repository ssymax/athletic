import { getMember } from "@/app/actions/members";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteMemberButton } from "./components/DeleteMemberButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { daysLeft, isMembershipValid, memberStatus } from "@/lib/memberships";

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

function statusLabel(status: string) {
  if (status === "ACTIVE") return "Aktywny";
  if (status === "EXPIRED") return "Wygasły";
  if (status === "CANCELLED") return "Anulowany";
  return status;
}

function statusBadge(status: string) {
  if (status === "ACTIVE") return "badge-success";
  if (status === "EXPIRED") return "badge-warning";
  return "badge-neutral";
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

  const hasValidMembership = member.memberships.some((membership) =>
    isMembershipValid(membership),
  );
  const status = memberStatus(member.active, hasValidMembership);

  return (
    <div className="fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/members" className="text-muted">
          ← Wróć
        </Link>
        <h1>
          {member.firstName} {member.lastName}
        </h1>
        <span className={`badge ${status.badgeClass}`}>{status.label}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card title="Dane Klubowicza">
            <div className="space-y-4">
              <div>
                <span className="label text-muted">Numer telefonu</span>
                <p className="font-medium">{member.phoneNumber}</p>
              </div>
              <div>
                <span className="label text-muted">Notatki</span>
                <p className="whitespace-pre-wrap">{member.notes || "-"}</p>
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <Link
                  href={`/members/${id}/edit`}
                  className="btn btn-outline w-full"
                >
                  Edytuj dane
                </Link>
                <DeleteMemberButton
                  id={member.id}
                  fullName={`${member.firstName} ${member.lastName}`}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Karnety</h3>
              <Link href={`/members/${id}/memberships/new`}>
                <Button size="sm">Sprzedaj Karnet</Button>
              </Link>
            </div>

            <div className="table-wrap">
              <table className="table">
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
                      <td colSpan={7} className="table-empty">
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
                              <div className="text-muted text-xs">
                                {validityLabel(membership.endDate)}
                              </div>
                            )}
                        </td>
                        <td>
                          <span
                            className={`badge ${statusBadge(membership.status)}`}
                          >
                            {statusLabel(membership.status)}
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
