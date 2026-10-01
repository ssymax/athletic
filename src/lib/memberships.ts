// Default membership validity in days — applies to both time-based and
// entry-based memberships (the latter also expire over time, not only once entries are used up).
export const DEFAULT_DAYS_VALID = 30;

// How many days before a membership ends we remind about it on the dashboard.
export const EXPIRY_REMINDER_DAYS = 7;

// For how many days after a membership expires we show the member on the dashboard.
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

// A membership is exhausted when the expiry date has passed (the end date itself
// is still valid) or when an entry-based membership has no entries left.
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

// `labelKey` is a key in the "members" namespace.
export type MemberStatus = {
  labelKey: "status.inactive" | "status.noValidMembership" | "status.active";
  badgeClass: string;
};

// A member without a valid membership cannot be shown as active.
export function memberStatus(
  active: boolean,
  hasValidMembership: boolean,
): MemberStatus {
  if (!active)
    return { labelKey: "status.inactive", badgeClass: "badge-danger" };
  if (!hasValidMembership)
    return {
      labelKey: "status.noValidMembership",
      badgeClass: "badge-warning",
    };
  return { labelKey: "status.active", badgeClass: "badge-success" };
}
