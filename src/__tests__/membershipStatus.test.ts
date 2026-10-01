import { describe, it, expect } from "vitest";
import {
  addDays,
  daysLeft,
  EXPIRY_REMINDER_DAYS,
  isMembershipExpired,
  isMembershipValid,
  memberStatus,
} from "@/lib/memberships";

const TIME = { type: "TIME" };
const ENTRY = { type: "ENTRY" };

describe("isMembershipExpired", () => {
  const now = new Date("2026-09-11T10:00:00");

  it("treats the last day of validity as still valid", () => {
    expect(
      isMembershipExpired(
        { endDate: new Date("2026-09-11"), remainingEntries: null, type: TIME },
        now,
      ),
    ).toBe(false);
  });

  it("expires a membership one day after endDate", () => {
    expect(
      isMembershipExpired(
        { endDate: new Date("2026-09-10"), remainingEntries: null, type: TIME },
        now,
      ),
    ).toBe(true);
  });

  it("never expires an open-ended membership", () => {
    expect(
      isMembershipExpired(
        { endDate: null, remainingEntries: null, type: TIME },
        now,
      ),
    ).toBe(false);
  });

  it("expires an ENTRY membership without entries left", () => {
    expect(
      isMembershipExpired(
        { endDate: null, remainingEntries: 0, type: ENTRY },
        now,
      ),
    ).toBe(true);
  });

  it("keeps an ENTRY membership with entries left", () => {
    expect(
      isMembershipExpired(
        { endDate: addDays(now, 5), remainingEntries: 2, type: ENTRY },
        now,
      ),
    ).toBe(false);
  });
});

describe("isMembershipValid", () => {
  const now = new Date("2026-09-11T10:00:00");

  it("requires the ACTIVE status", () => {
    const membership = {
      status: "EXPIRED",
      endDate: addDays(now, 10),
      remainingEntries: null,
      type: TIME,
    };
    expect(isMembershipValid(membership, now)).toBe(false);
    expect(isMembershipValid({ ...membership, status: "ACTIVE" }, now)).toBe(
      true,
    );
  });

  it("rejects an ACTIVE membership that is already past its endDate", () => {
    expect(
      isMembershipValid(
        {
          status: "ACTIVE",
          endDate: addDays(now, -1),
          remainingEntries: null,
          type: TIME,
        },
        now,
      ),
    ).toBe(false);
  });
});

describe("memberStatus", () => {
  it("marks a deactivated member as inactive", () => {
    expect(memberStatus(false, true).labelKey).toBe("status.inactive");
  });

  it("never shows a member without a valid membership as active", () => {
    const status = memberStatus(true, false);
    expect(status.labelKey).toBe("status.noValidMembership");
    expect(status.badgeClass).not.toBe("badge-success");
  });

  it("shows an active member with a valid membership as active", () => {
    expect(memberStatus(true, true).labelKey).toBe("status.active");
  });
});

describe("daysLeft", () => {
  const now = new Date("2026-09-11T23:30:00");

  it("counts calendar days regardless of time of day", () => {
    expect(daysLeft(new Date("2026-09-18"), now)).toBe(EXPIRY_REMINDER_DAYS);
    expect(daysLeft(new Date("2026-09-11"), now)).toBe(0);
    expect(daysLeft(new Date("2026-09-09"), now)).toBe(-2);
  });
});
