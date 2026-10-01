import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { getMembers } from "@/app/actions/members";
import { Button } from "@/components/ui/Button";
import {
  daysLeft,
  EXPIRY_REMINDER_DAYS,
  memberStatus,
} from "@/lib/memberships";

type MemberRow = Awaited<ReturnType<typeof getMembers>>[number];
type Translator = Awaited<ReturnType<typeof getTranslations<"members">>>;
type DateFormatter = Awaited<ReturnType<typeof getFormatter>>;

function formatMembershipStatus(
  member: MemberRow,
  t: Translator,
  format: DateFormatter,
) {
  if (!member.primaryMembership) {
    return t("noActiveMembership");
  }

  if (member.primaryMembership.type.type === "TIME") {
    if (!member.primaryMembership.endDate) {
      return t("expiresNoDate");
    }
    return t("expires", {
      date: format.dateTime(new Date(member.primaryMembership.endDate), {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }),
    });
  }

  return t("remainingEntries", {
    count: member.primaryMembership.remainingEntries ?? 0,
  });
}

function expiryWarning(endDate: Date | null | undefined, t: Translator) {
  if (!endDate) return null;
  const left = daysLeft(endDate);
  if (left === null || left < 0 || left > EXPIRY_REMINDER_DAYS) return null;
  if (left === 0) return t("warnToday");
  if (left === 1) return t("warnTomorrow");
  return t("warnDays", { days: left });
}

// Date/entry count on one line, membership-ending warning underneath —
// the badge is inline-flex, so without its own row it would stick to the date.
function MembershipValidityCell({
  member,
  t,
  format,
}: {
  member: MemberRow;
  t: Translator;
  format: DateFormatter;
}) {
  const warning = expiryWarning(member.primaryMembership?.endDate, t);

  return (
    <div className="flex flex-col items-start gap-2">
      <span className="whitespace-nowrap">
        {formatMembershipStatus(member, t, format)}
      </span>
      {warning && <span className="badge badge-warning">{warning}</span>}
    </div>
  );
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const t = await getTranslations("members");
  const format = await getFormatter();
  const query = (await searchParams).q || "";
  const members = await getMembers(query);

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1>{t("title")}</h1>
        <Link href="/members/add">
          <Button>{t("add")}</Button>
        </Link>
      </div>

      <div className="card">
        <div className="section-break mb-6">
          <form className="flex gap-2">
            <input
              type="search"
              name="q"
              placeholder={t("searchPlaceholder")}
              defaultValue={query}
              className="input-field"
            />
            <Button type="submit" variant="secondary">
              {t("search")}
            </Button>
          </form>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("columns.name")}</th>
                <th>{t("columns.phone")}</th>
                <th>{t("columns.membership")}</th>
                <th>{t("columns.remaining")}</th>
                <th>{t("columns.status")}</th>
                <th>{t("columns.notes")}</th>
                <th>{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    {t("empty")}
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
                          {t("noActiveMembership")}
                        </span>
                      )}
                    </td>
                    <td>
                      <MembershipValidityCell
                        member={member}
                        t={t}
                        format={format}
                      />
                    </td>
                    <td>
                      {(() => {
                        const status = memberStatus(
                          member.active,
                          member.hasValidMembership,
                        );
                        return (
                          <span className={`badge ${status.badgeClass}`}>
                            {t(status.labelKey)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="text-muted notes-cell text-ellipsis">
                      {member.notes || "-"}
                    </td>
                    <td>
                      <Link
                        href={`/members/${member.id}`}
                        className="text-primary font-medium"
                      >
                        {t("details")}
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
