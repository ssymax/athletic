// Domyślna ważność karnetu w dniach — dotyczy zarówno karnetów czasowych,
// jak i wejściowych (te też wygasają po czasie, nie tylko po wykorzystaniu wejść).
export const DEFAULT_DAYS_VALID = 30;

// Ile dni przed końcem karnetu przypominamy o nim na panelu głównym.
export const EXPIRY_REMINDER_DAYS = 7;

// Przez ile dni po wygaśnięciu karnetu pokazujemy klubowicza na panelu głównym.
export const LAPSED_REMINDER_DAYS = 20;

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

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysLeft(endDate: Date | null, from: Date = new Date()) {
  if (!endDate) return null;
  return Math.ceil(
    (startOfDay(new Date(endDate)).getTime() - startOfDay(from).getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

export type MembershipValidity = {
  endDate: Date | string | null;
  remainingEntries: number | null;
  type: { type: string };
};

// Karnet jest wyczerpany, gdy minęła data ważności (dzień końca jest jeszcze
// ważny) albo gdy karnet wejściowy nie ma już wejść.
export function isMembershipExpired(
  membership: MembershipValidity,
  now: Date = new Date(),
): boolean {
  if (membership.endDate) {
    const left = daysLeft(new Date(membership.endDate), now);
    if (left !== null && left < 0) return true;
  }

  if (
    membership.type.type === "ENTRY" &&
    membership.remainingEntries !== null &&
    membership.remainingEntries <= 0
  ) {
    return true;
  }

  return false;
}

export function isMembershipValid(
  membership: MembershipValidity & { status: string },
  now: Date = new Date(),
): boolean {
  return (
    membership.status === "ACTIVE" && !isMembershipExpired(membership, now)
  );
}

export type MemberStatus = { label: string; badgeClass: string };

// Klubowicz bez ważnego karnetu nie może być pokazany jako "Aktywny".
export function memberStatus(
  active: boolean,
  hasValidMembership: boolean,
): MemberStatus {
  if (!active) return { label: "Nieaktywny", badgeClass: "badge-danger" };
  if (!hasValidMembership)
    return { label: "Brak ważnego karnetu", badgeClass: "badge-warning" };
  return { label: "Aktywny", badgeClass: "badge-success" };
}
