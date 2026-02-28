import Link from "next/link";
import { getMembers } from "@/app/actions/members";
import { Button } from "@/components/ui/Button";

function formatMembershipStatus(
  member: Awaited<ReturnType<typeof getMembers>>[number],
) {
  if (!member.primaryMembership) {
    return "Brak aktywnego karnetu";
  }

  if (member.primaryMembership.type.type === "TIME") {
    if (!member.primaryMembership.endDate) {
      return "Wygasa: -";
    }
    return `Wygasa: ${new Date(member.primaryMembership.endDate).toLocaleDateString("pl-PL")}`;
  }

  return `Pozostało: ${member.primaryMembership.remainingEntries ?? 0} wejść`;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const query = (await searchParams).q || "";
  const members = await getMembers(query);

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1>Klubowicze</h1>
        <Link href="/members/add">
          <Button>Dodaj Klubowicza</Button>
        </Link>
      </div>

      <div className="card">
        <div className="section-break mb-6">
          <form className="flex gap-2">
            <input
              type="search"
              name="q"
              placeholder="Szukaj po nazwisku lub numerze..."
              defaultValue={query}
              className="input-field"
            />
            <Button type="submit" variant="secondary">
              Szukaj
            </Button>
          </form>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Imię i Nazwisko</th>
                <th>Telefon</th>
                <th>Karnet</th>
                <th>Pozostało / Wygasa</th>
                <th>Status</th>
                <th>Notatki</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    Brak klubowiczów. Dodaj pierwszego!
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id}>
                    <td className="font-medium">
                      {member.firstName} {member.lastName}
                    </td>
                    <td>{member.phoneNumber}</td>
                    <td>
                      {member.primaryMembership ? (
                        <span className="font-medium">
                          {member.primaryMembership.type.name}
                        </span>
                      ) : (
                        <span className="text-muted">
                          Brak aktywnego karnetu
                        </span>
                      )}
                    </td>
                    <td>{formatMembershipStatus(member)}</td>
                    <td>
                      <span
                        className={`badge ${member.active ? "badge-success" : "badge-danger"}`}
                      >
                        {member.active ? "Aktywny" : "Nieaktywny"}
                      </span>
                    </td>
                    <td className="text-muted notes-cell text-ellipsis">
                      {member.notes || "-"}
                    </td>
                    <td>
                      <Link
                        href={`/members/${member.id}`}
                        className="text-primary font-medium"
                      >
                        Szczegóły
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
  );
}
