// Domyślna ważność karnetu w dniach — dotyczy zarówno karnetów czasowych,
// jak i wejściowych (te też wygasają po czasie, nie tylko po wykorzystaniu wejść).
export const DEFAULT_DAYS_VALID = 30;

export function resolveDaysValid(
  type: string,
  daysValid: number | null | undefined,
): number | null {
  if (type === "ENTRY") return daysValid ?? DEFAULT_DAYS_VALID;
  return daysValid ?? null;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysLeft(endDate: Date | null, from: Date = new Date()) {
  if (!endDate) return null;
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.ceil(
    (startOfDay(new Date(endDate)) - startOfDay(from)) / (1000 * 60 * 60 * 24),
  );
}
