import Link from "next/link";
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

function expiryLabel(endDate: Date | null) {
  const left = daysLeft(endDate);
  if (left === null) return "";
  if (left <= 0) return "kończy się dziś";
  if (left === 1) return "został 1 dzień";
  return `zostało ${left} dni`;
}

function lapsedLabel(daysWithout: number) {
  if (daysWithout === 1) return "brak karnetu od 1 dnia";
  return `brak karnetu od ${daysWithout} dni`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ lista?: string }>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const showLapsed = (await searchParams).lista === "brak-karnetu";

  // Pobranie kończących się karnetów najpierw domyka te po terminie,
  // więc statystyki niżej liczą się już na poprawnych statusach.
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
      <h1 className="mb-6">Panel Główny</h1>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex flex-col">
            <span className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">
              Aktywni Klubowicze
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
              Sprzedaż Dzisiaj
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
              Aktywne Karnety
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
            Koniec karnetu ≤ {EXPIRY_REMINDER_DAYS} dni (
            {expiringMemberships.length})
          </Link>
          <Link
            href="/dashboard?lista=brak-karnetu"
            scroll={false}
            className={`btn btn-sm ${showLapsed ? "btn-secondary" : "btn-ghost"}`}
          >
            Brak karnetu 1–{LAPSED_REMINDER_DAYS} dni ({lapsedMembers.length})
          </Link>
        </div>

        {showLapsed ? (
          lapsedMembers.length === 0 ? (
            <p className="text-sm text-muted">
              Brak klubowiczów, którym karnet skończył się w ostatnich{" "}
              {LAPSED_REMINDER_DAYS} dniach.
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
                      {lapsed.type.name} · tel. {lapsed.member.phoneNumber}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="badge badge-danger">
                      {lapsedLabel(lapsed.daysWithout)}
                    </span>
                    <span className="text-xs text-muted mt-1">
                      ważny do{" "}
                      {new Date(lapsed.lastValidDay).toLocaleDateString(
                        "pl-PL",
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : expiringMemberships.length === 0 ? (
          <p className="text-sm text-muted">
            Brak karnetów kończących się w najbliższych {EXPIRY_REMINDER_DAYS}{" "}
            dniach.
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
                    {membership.type.name} · tel.{" "}
                    {membership.member.phoneNumber}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="badge badge-warning">
                    {expiryLabel(membership.endDate)}
                  </span>
                  <span className="text-xs text-muted mt-1">
                    do{" "}
                    {membership.endDate
                      ? new Date(membership.endDate).toLocaleDateString("pl-PL")
                      : "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Ostatnie Wejścia">
          <div className="flex flex-col gap-3">
            {recentCheckins.length === 0 ? (
              <p className="text-sm text-muted">Brak ostatnich wejść.</p>
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
                    {new Date(checkin.date).toLocaleTimeString([], {
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
              Zobacz wszystkie wejścia &rarr;
            </Link>
          </div>
        </Card>

        <Card title="Szybkie Akcje">
          <div className="grid grid-cols-2 gap-4">
            <Link href="/checkin" className="card quick-action">
              <div className="quick-action-icon">✅</div>
              <span className="text-sm font-medium">Wejście</span>
            </Link>
            <Link href="/pos" className="card quick-action">
              <div className="quick-action-icon">🛒</div>
              <span className="text-sm font-medium">Sprzedaż</span>
            </Link>
            <Link href="/members/add" className="card quick-action">
              <div className="quick-action-icon">👤</div>
              <span className="text-sm font-medium">Dodaj Klubowicza</span>
            </Link>
            {isAdmin && (
              <Link href="/reports" className="card quick-action">
                <div className="quick-action-icon">📈</div>
                <span className="text-sm font-medium">Raporty</span>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
