import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import prisma from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { auth } from "@/auth";
import {
  getExpiringMemberships,
  getLapsedMembers,
} from "@/app/actions/memberships";
import {
  daysLeft,
  EXPIRY_REMINDER_DAYS,
  LAPSED_REMINDER_DAYS,
} from "@/lib/memberships";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ lista?: string }>;
}) {
  const t = await getTranslations("dashboard");
  const format = await getFormatter();
  const dateFormat = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  } as const;
  const expiryLabel = (endDate: Date | null) => {
    const left = daysLeft(endDate);
    if (left === null) return "";
    if (left <= 0) return t("expiresToday");
    return t("daysLeft", { days: left });
  };
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const showLapsed = (await searchParams).lista === "brak-karnetu";

  // Fetching expiring memberships first closes the overdue ones,
  // so the stats below are computed on correct statuses.
  const expiringMemberships = await getExpiringMemberships();
  const lapsedMembers = await getLapsedMembers();

  // Basic stats for dashboard
  const membersCount = await prisma.member.count({ where: { active: true } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySales = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    where: {
      date: {
        gte: today,
      },
    },
  });

  const activeMemberships = await prisma.membership.count({
    where: { status: "ACTIVE" },
  });

  // Recent checkins (USE_ENTRY action in history)
  const recentCheckins = await prisma.membershipHistory.findMany({
    where: { action: "USE_ENTRY" },
    take: 5,
    orderBy: { date: "desc" },
    include: {
      membership: {
        include: { member: true },
      },
    },
  });

  return (
    <div className="fade-in">
      <h1 className="mb-6">{t("title")}</h1>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex flex-col">
            <span className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">
              {t("activeMembers")}
            </span>
            <div className="flex items-center justify-between">
              <span className="stat-value">{membersCount}</span>
              <span className="text-xl">👥</span>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col">
            <span className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">
              {t("salesToday")}
            </span>
            <div className="flex items-center justify-between">
              <span className="stat-value">
                {(todaySales._sum.totalAmount || 0).toFixed(2)} PLN
              </span>
              <span className="text-xl">💰</span>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col">
            <span className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">
              {t("activeMemberships")}
            </span>
            <div className="flex items-center justify-between">
              <span className="stat-value">{activeMemberships}</span>
              <span className="text-xl">🎫</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/dashboard"
            scroll={false}
            className={`btn btn-sm ${showLapsed ? "btn-ghost" : "btn-secondary"}`}
          >
            {t("expiringTab", {
              days: EXPIRY_REMINDER_DAYS,
              count: expiringMemberships.length,
            })}
          </Link>
          <Link
            href="/dashboard?lista=brak-karnetu"
            scroll={false}
            className={`btn btn-sm ${showLapsed ? "btn-secondary" : "btn-ghost"}`}
          >
            {t("lapsedTab", {
              days: LAPSED_REMINDER_DAYS,
              count: lapsedMembers.length,
            })}
          </Link>
        </div>

        {showLapsed ? (
          lapsedMembers.length === 0 ? (
            <p className="text-sm text-muted">
              {t("lapsedEmpty", { days: LAPSED_REMINDER_DAYS })}
            </p>
          ) : (
            <div className="scroll-list flex flex-col gap-3">
              {lapsedMembers.map((lapsed) => (
                <div
                  key={lapsed.memberId}
                  className="panel-soft flex items-center justify-between p-3"
                >
                  <div className="flex flex-col">
                    <Link
                      href={`/members/${lapsed.memberId}`}
                      className="font-medium text-primary"
                    >
                      {lapsed.member.firstName} {lapsed.member.lastName}
                    </Link>
                    <span className="text-xs text-muted">
                      {t("memberLine", {
                        type: lapsed.type.name,
                        phone: lapsed.member.phoneNumber,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="badge badge-danger">
                      {t("lapsedSince", { days: lapsed.daysWithout })}
                    </span>
                    <span className="text-xs text-muted mt-1">
                      {t("lapsedValidUntil", {
                        date: format.dateTime(
                          new Date(lapsed.lastValidDay),
                          dateFormat,
                        ),
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : expiringMemberships.length === 0 ? (
          <p className="text-sm text-muted">
            {t("expiringEmpty", { days: EXPIRY_REMINDER_DAYS })}
          </p>
        ) : (
          <div className="scroll-list flex flex-col gap-3">
            {expiringMemberships.map((membership) => (
              <div
                key={membership.id}
                className="panel-soft flex items-center justify-between p-3"
              >
                <div className="flex flex-col">
                  <Link
                    href={`/members/${membership.memberId}`}
                    className="font-medium text-primary"
                  >
                    {membership.member.firstName} {membership.member.lastName}
                  </Link>
                  <span className="text-xs text-muted">
                    {t("memberLine", {
                      type: membership.type.name,
                      phone: membership.member.phoneNumber,
                    })}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="badge badge-warning">
                    {expiryLabel(membership.endDate)}
                  </span>
                  <span className="text-xs text-muted mt-1">
                    {t("validUntil", {
                      date: membership.endDate
                        ? format.dateTime(
                            new Date(membership.endDate),
                            dateFormat,
                          )
                        : "-",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card title={t("recentCheckins")}>
          <div className="flex flex-col gap-3">
            {recentCheckins.length === 0 ? (
              <p className="text-sm text-muted">{t("noRecentCheckins")}</p>
            ) : (
              recentCheckins.map((checkin) => (
                <div
                  key={checkin.id}
                  className="panel-soft flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="dot dot-success"></div>
                    <span className="font-medium">
                      {checkin.membership.member.firstName}{" "}
                      {checkin.membership.member.lastName}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {format.dateTime(new Date(checkin.date), {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
            <Link
              href="/checkin"
              className="text-sm font-medium text-primary mt-2"
            >
              {t("viewAllCheckins")}
            </Link>
          </div>
        </Card>

        <Card title={t("quickActions")}>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/checkin" className="card quick-action">
              <div className="quick-action-icon">✅</div>
              <span className="text-sm font-medium">{t("actionCheckin")}</span>
            </Link>
            <Link href="/pos" className="card quick-action">
              <div className="quick-action-icon">🛒</div>
              <span className="text-sm font-medium">{t("actionSale")}</span>
            </Link>
            <Link href="/members/add" className="card quick-action">
              <div className="quick-action-icon">👤</div>
              <span className="text-sm font-medium">
                {t("actionAddMember")}
              </span>
            </Link>
            {isAdmin && (
              <Link href="/reports" className="card quick-action">
                <div className="quick-action-icon">📈</div>
                <span className="text-sm font-medium">
                  {t("actionReports")}
                </span>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
