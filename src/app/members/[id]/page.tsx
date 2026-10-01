import { getMember } from "@/app/actions/members";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { DeleteMemberButton } from "./components/DeleteMemberButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { daysLeft, isMembershipValid, memberStatus } from "@/lib/memberships";

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
  const t = await getTranslations("members");
  const tm = await getTranslations("memberships");
  const format = await getFormatter();
  const formatDate = (date: Date | string | null | undefined) =>
    date
      ? format.dateTime(new Date(date), {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        })
      : "-";
  const validityLabel = (endDate: Date | null) => {
    const left = daysLeft(endDate);
    if (left === null) return t("detail.indefinite");
    if (left < 0) return t("detail.expiredAgo", { days: Math.abs(left) });
    if (left === 0) return t("detail.expiresToday");
    return t("detail.daysLeft", { days: left });
  };
  const statusLabel = (status: string) =>
    tm.has(`status.${status}`) ? tm(`status.${status}`) : status;
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
          {t("back")}
        </Link>
        <h1>
          {member.firstName} {member.lastName}
        </h1>
        <span className={`badge ${status.badgeClass}`}>
          {t(status.labelKey)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card title={t("detail.memberData")}>
            <div className="space-y-4">
              <div>
                <span className="label text-muted">{t("detail.phone")}</span>
                <p className="font-medium">{member.phoneNumber}</p>
              </div>
              <div>
                <span className="label text-muted">{t("detail.notes")}</span>
                <p className="whitespace-pre-wrap">{member.notes || "-"}</p>
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <Link
                  href={`/members/${id}/edit`}
                  className="btn btn-outline w-full"
                >
                  {t("detail.edit")}
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
              <h3 className="text-xl font-semibold">
                {t("detail.memberships")}
              </h3>
              <Link href={`/members/${id}/memberships/new`}>
                <Button size="sm">{t("detail.sell")}</Button>
              </Link>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("detail.type")}</th>
                    <th>{t("detail.purchaseDate")}</th>
                    <th>{t("detail.validityPeriod")}</th>
                    <th>{t("detail.remaining")}</th>
                    <th>{t("detail.status")}</th>
                    <th>{t("detail.price")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {member.memberships.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        {t("detail.noHistory")}
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
                            : t("detail.indefinite")}
                        </td>
                        <td className="whitespace-nowrap">
                          {membership.type.type === "ENTRY" && (
                            <div>
                              {t("detail.entries", {
                                count: membership.remainingEntries ?? 0,
                              })}
                            </div>
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
                          {t("detail.priceValue", {
                            price: membership.pricePaid.toFixed(2),
                          })}
                        </td>
                        <td>
                          <Link
                            href={`/members/${id}/memberships/${membership.id}/edit`}
                            className="text-primary text-sm font-medium"
                          >
                            {t("detail.editMembership")}
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
