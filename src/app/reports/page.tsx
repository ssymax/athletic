import { getSalesReport, getExpiringMemberships } from "@/app/actions/reports";
import { EXPIRY_REMINDER_DAYS } from "@/lib/memberships";
import { Button } from "@/components/ui/Button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

type ReportsPreset = "weekly" | "monthly" | "custom";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateParam(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map((chunk) => Number(chunk));
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getPresetRange(
  preset: Exclude<ReportsPreset, "custom">,
  referenceDate: Date,
) {
  const end = new Date(referenceDate);
  const start = new Date(referenceDate);

  if (preset === "weekly") {
    start.setDate(start.getDate() - 6);
  } else {
    start.setDate(start.getDate() - 29);
  }

  return { start, end };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; preset?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const t = await getTranslations("reports");
  const format = await getFormatter();
  const formatDate = (date: Date) =>
    format.dateTime(date, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  const money = (amount: number) => t("money", { amount: amount.toFixed(2) });
  const params = await searchParams;
  const today = new Date();

  const presetParam =
    params.preset === "weekly" || params.preset === "monthly"
      ? params.preset
      : "custom";

  const weeklyRange = getPresetRange("weekly", today);
  const monthlyRange = getPresetRange("monthly", today);

  const startParam = parseDateParam(params.start);
  const endParam = parseDateParam(params.end);

  let rangeStart: Date;
  let rangeEnd: Date;

  if (startParam && endParam) {
    rangeStart = startParam;
    rangeEnd = endParam;
  } else if (presetParam === "weekly") {
    rangeStart = weeklyRange.start;
    rangeEnd = weeklyRange.end;
  } else if (presetParam === "monthly") {
    rangeStart = monthlyRange.start;
    rangeEnd = monthlyRange.end;
  } else {
    rangeStart = weeklyRange.start;
    rangeEnd = weeklyRange.end;
  }

  if (rangeStart > rangeEnd) {
    [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
  }

  const start = formatDateInput(rangeStart);
  const end = formatDateInput(rangeEnd);
  const report = await getSalesReport(rangeStart, rangeEnd);
  const expiringMemberships = await getExpiringMemberships();

  return (
    <div className="fade-in">
      <h1 className="mb-6">{t("title")}</h1>

      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-2">
          <form className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="preset" value="custom" />
            <div>
              <label htmlFor="start">{t("from")}</label>
              <input
                id="start"
                type="date"
                name="start"
                defaultValue={start}
                className="input-field input-compact"
              />
            </div>
            <div>
              <label htmlFor="end">{t("to")}</label>
              <input
                id="end"
                type="date"
                name="end"
                defaultValue={end}
                className="input-field input-compact"
              />
            </div>
            <Button type="submit" size="sm">
              {t("show")}
            </Button>
          </form>

          <form className="inline-flex">
            <input type="hidden" name="preset" value="weekly" />
            <input
              type="hidden"
              name="start"
              value={formatDateInput(weeklyRange.start)}
            />
            <input
              type="hidden"
              name="end"
              value={formatDateInput(weeklyRange.end)}
            />
            <Button
              type="submit"
              size="sm"
              variant={presetParam === "weekly" ? "secondary" : "ghost"}
            >
              {t("weekly")}
            </Button>
          </form>

          <form className="inline-flex">
            <input type="hidden" name="preset" value="monthly" />
            <input
              type="hidden"
              name="start"
              value={formatDateInput(monthlyRange.start)}
            />
            <input
              type="hidden"
              name="end"
              value={formatDateInput(monthlyRange.end)}
            />
            <Button
              type="submit"
              size="sm"
              variant={presetParam === "monthly" ? "secondary" : "ghost"}
            >
              {t("monthly")}
            </Button>
          </form>

          <form className="inline-flex">
            <input type="hidden" name="preset" value="custom" />
            <input type="hidden" name="start" value={start} />
            <input type="hidden" name="end" value={end} />
            <Button
              type="submit"
              size="sm"
              variant={presetParam === "custom" ? "secondary" : "ghost"}
            >
              {t("custom")}
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2>{t("salesInRange")}</h2>
            <span className="text-sm text-muted">
              {formatDate(rangeStart)} - {formatDate(rangeEnd)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="panel-soft">
              <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">
                {t("totalRevenue")}
              </p>
              <p className="stat-value stat-value-highlight">
                {t("totalAmount", { amount: report.totalSales.toFixed(2) })}
              </p>
            </div>
            <div className="panel-soft">
              <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">
                {t("transactionCount")}
              </p>
              <p className="stat-value">
                {report.salesCount + report.membershipsCount}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider mb-4">
                {t("byPaymentMethod")}
              </p>
              <div className="flex justify-between py-2 stat-line">
                <span className="text-sm">{t("cash")}</span>
                <span className="text-sm font-bold">
                  {money(report.byMethod.CASH)}
                </span>
              </div>
              <div className="flex justify-between py-2 stat-line">
                <span className="text-sm">{t("card")}</span>
                <span className="text-sm font-bold">
                  {money(report.byMethod.CARD)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider mb-4">
                {t("byType")}
              </p>
              <div className="flex justify-between py-2 stat-line">
                <span className="text-sm">
                  {t("membershipsCount", { count: report.membershipsCount })}
                </span>
                <span className="text-sm font-bold">
                  {money(report.membershipsTotal)}
                </span>
              </div>
              <div className="flex justify-between py-2 stat-line">
                <span className="text-sm">
                  {t("productsCount", { count: report.salesCount })}
                </span>
                <span className="text-sm font-bold">
                  {money(report.productsTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-6">
            {t("expiringTitle")}{" "}
            <span className="text-sm text-muted">{t("expiringDays", { days: EXPIRY_REMINDER_DAYS })}</span>
          </h2>
          {expiringMemberships.length === 0 ? (
            <p className="text-muted table-empty">{t("expiringEmpty")}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("colMember")}</th>
                    <th>{t("colMembership")}</th>
                    <th>{t("colExpires")}</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringMemberships.map((m) => (
                    <tr key={m.id}>
                      <td>
                        {m.member.firstName} {m.member.lastName}
                      </td>
                      <td>{m.type.name}</td>
                      <td>
                        <span className="badge badge-danger">
                          {m.endDate ? formatDate(new Date(m.endDate)) : "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h2 className="mb-4">{t("productsInRange")}</h2>
          {report.productsList.length === 0 ? (
            <p className="text-muted table-empty">{t("productsEmpty")}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("colProduct")}</th>
                    <th>{t("colQuantity")}</th>
                    <th>{t("colRevenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.productsList.map((product) => (
                    <tr key={product.id}>
                      <td className="font-medium">{product.name}</td>
                      <td>{product.quantity}</td>
                      <td>{money(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4">{t("membershipsInRange")}</h2>
          {report.membershipsList.length === 0 ? (
            <p className="text-muted table-empty">{t("membershipsEmpty")}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("colMembership")}</th>
                    <th>{t("colType")}</th>
                    <th>{t("colCount")}</th>
                    <th>{t("colRevenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.membershipsList.map((membership) => (
                    <tr key={membership.id}>
                      <td className="font-medium">{membership.name}</td>
                      <td>
                        {membership.type === "TIME"
                          ? t("typeTime")
                          : t("typeEntries")}
                      </td>
                      <td>{membership.count}</td>
                      <td>{money(membership.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
