import Link from "next/link";
import prisma from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

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
