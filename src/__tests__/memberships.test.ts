import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const prismaMock = vi.hoisted(() => ({
  membershipType: {
    findUnique: vi.fn(),
  },
  membership: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  membershipHistory: {
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ default: prismaMock }));

import {
  expireOutdatedMemberships,
  getExpiringMemberships,
  sellMembership,
  updateMembership,
} from "@/app/actions/memberships";

function futureDate(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

describe("sellMembership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when required fields are missing", async () => {
    const fd = new FormData();
    // Missing typeId, startDate, paymentMethod
    await expect(sellMembership("memberId", fd)).rejects.toThrow(
      "Missing required fields",
    );
  });

  it("throws when membership type is not found", async () => {
    prismaMock.membershipType.findUnique.mockResolvedValue(null);

    const fd = new FormData();
    fd.set("typeId", "nonexistent");
    fd.set("startDate", "2025-01-01");
    fd.set("paymentMethod", "CASH");

    await expect(sellMembership("memberId", fd)).rejects.toThrow(
      "Invalid membership type",
    );
  });

  it("creates TIME membership with calculated endDate", async () => {
    prismaMock.membershipType.findUnique.mockResolvedValue({
      id: "type1",
      type: "TIME",
      name: "Miesięczny",
      price: 99,
      daysValid: 30,
      entries: null,
    });
    prismaMock.membership.create.mockResolvedValue({ id: "ms1" });

    const fd = new FormData();
    fd.set("typeId", "type1");
    fd.set("startDate", "2025-01-01");
    fd.set("paymentMethod", "CASH");

    const result = await sellMembership("memberId", fd);

    expect(result).toEqual({ success: true });

    const createData = prismaMock.membership.create.mock.calls[0][0].data;
    expect(createData.memberId).toBe("memberId");
    expect(createData.typeId).toBe("type1");
    expect(createData.status).toBe("ACTIVE");
    expect(createData.paymentMethod).toBe("CASH");
    expect(createData.pricePaid).toBe(99);
    expect(createData.remainingEntries).toBeNull();

    // endDate should be startDate + 30 days
    const start = new Date("2025-01-01");
    const expectedEnd = new Date(start);
    expectedEnd.setDate(expectedEnd.getDate() + 30);
    expect(createData.endDate).toEqual(expectedEnd);
  });

  it("creates ENTRY membership with remainingEntries and default 30-day endDate", async () => {
    prismaMock.membershipType.findUnique.mockResolvedValue({
      id: "type2",
      type: "ENTRY",
      name: "10 wejść",
      price: 120,
      daysValid: null,
      entries: 10,
    });
    prismaMock.membership.create.mockResolvedValue({ id: "ms2" });

    const fd = new FormData();
    fd.set("typeId", "type2");
    fd.set("startDate", "2025-03-01");
    fd.set("paymentMethod", "CARD");

    const result = await sellMembership("memberId", fd);

    expect(result).toEqual({ success: true });

    const createData = prismaMock.membership.create.mock.calls[0][0].data;
    expect(createData.remainingEntries).toBe(10);
    expect(createData.pricePaid).toBe(120);
    expect(createData.paymentMethod).toBe("CARD");

    // Karnet wejściowy bez własnego limitu dni jest ważny 30 dni
    const expectedEnd = new Date("2025-03-01");
    expectedEnd.setDate(expectedEnd.getDate() + 30);
    expect(createData.endDate).toEqual(expectedEnd);
  });

  it("respects a custom daysValid on ENTRY membership types", async () => {
    prismaMock.membershipType.findUnique.mockResolvedValue({
      id: "type3",
      type: "ENTRY",
      name: "10 wejść (60 dni)",
      price: 150,
      daysValid: 60,
      entries: 10,
    });
    prismaMock.membership.create.mockResolvedValue({ id: "ms3" });

    const fd = new FormData();
    fd.set("typeId", "type3");
    fd.set("startDate", "2025-03-01");
    fd.set("paymentMethod", "CASH");

    await sellMembership("memberId", fd);

    const createData = prismaMock.membership.create.mock.calls[0][0].data;
    const expectedEnd = new Date("2025-03-01");
    expectedEnd.setDate(expectedEnd.getDate() + 60);
    expect(createData.endDate).toEqual(expectedEnd);
  });

  it("records PURCHASE action in history", async () => {
    prismaMock.membershipType.findUnique.mockResolvedValue({
      id: "type1",
      type: "TIME",
      name: "Miesięczny",
      price: 99,
      daysValid: 30,
      entries: null,
    });
    prismaMock.membership.create.mockResolvedValue({ id: "ms1" });

    const fd = new FormData();
    fd.set("typeId", "type1");
    fd.set("startDate", "2025-01-01");
    fd.set("paymentMethod", "CASH");

    await sellMembership("memberId", fd);

    const createData = prismaMock.membership.create.mock.calls[0][0].data;
    expect(createData.history.create.action).toBe("PURCHASE");
    expect(createData.history.create.details).toContain("Miesięczny");
    expect(createData.history.create.details).toContain("99");
  });
});

describe("updateMembership", () => {
  beforeEach(() => vi.clearAllMocks());

  function formData(overrides: Record<string, string> = {}) {
    const fd = new FormData();
    fd.set("startDate", "2026-01-01");
    fd.set("endDate", futureDate(10));
    fd.set("status", "ACTIVE");
    fd.set("paymentMethod", "CASH");
    fd.set("pricePaid", "99");
    fd.set("note", "");
    for (const [key, value] of Object.entries(overrides)) fd.set(key, value);
    return fd;
  }

  it("throws when the membership does not exist", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);
    await expect(updateMembership("ms1", "m1", formData())).rejects.toThrow(
      "Nie znaleziono karnetu",
    );
  });

  it("saves an edit and records it in the history", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      id: "ms1",
      type: { type: "TIME" },
    });
    prismaMock.membership.update.mockResolvedValue({});

    const result = await updateMembership("ms1", "m1", formData());

    expect(result).toEqual({ success: true });
    const data = prismaMock.membership.update.mock.calls[0][0].data;
    expect(data.status).toBe("ACTIVE");
    expect(data.pricePaid).toBe(99);
    expect(data.history.create.action).toBe("EDIT");
  });

  it("refuses ACTIVE status when the endDate is in the past", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      id: "ms1",
      type: { type: "TIME" },
    });

    await expect(
      updateMembership("ms1", "m1", formData({ endDate: futureDate(-1) })),
    ).rejects.toThrow(/nie może mieć statusu Aktywny/);
    expect(prismaMock.membership.update).not.toHaveBeenCalled();
  });

  it("refuses ACTIVE status for an ENTRY membership without entries left", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      id: "ms1",
      type: { type: "ENTRY" },
    });

    await expect(
      updateMembership("ms1", "m1", formData({ remainingEntries: "0" })),
    ).rejects.toThrow(/nie może mieć statusu Aktywny/);
    expect(prismaMock.membership.update).not.toHaveBeenCalled();
  });

  it("allows an expired membership to be saved as EXPIRED", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      id: "ms1",
      type: { type: "TIME" },
    });
    prismaMock.membership.update.mockResolvedValue({});

    await updateMembership(
      "ms1",
      "m1",
      formData({ endDate: futureDate(-1), status: "EXPIRED" }),
    );

    expect(prismaMock.membership.update).toHaveBeenCalled();
  });
});

describe("expireOutdatedMemberships", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when there is nothing to expire", async () => {
    prismaMock.membership.findMany.mockResolvedValue([]);
    expect(await expireOutdatedMemberships()).toBe(0);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("flips outdated ACTIVE memberships to EXPIRED and logs history", async () => {
    prismaMock.membership.findMany.mockResolvedValue([
      { id: "ms1", endDate: new Date("2020-01-01"), remainingEntries: null },
      { id: "ms2", endDate: null, remainingEntries: 0 },
    ]);
    prismaMock.$transaction.mockResolvedValue([]);

    expect(await expireOutdatedMemberships()).toBe(2);

    const updateArgs = prismaMock.membership.updateMany.mock.calls[0][0];
    expect(updateArgs).toEqual({
      where: { id: { in: ["ms1", "ms2"] } },
      data: { status: "EXPIRED" },
    });

    const historyArgs =
      prismaMock.membershipHistory.createMany.mock.calls[0][0];
    expect(historyArgs.data).toHaveLength(2);
    expect(historyArgs.data[0].action).toBe("EXPIRE");
    expect(historyArgs.data[0].details).toContain("data ważności");
    expect(historyArgs.data[1].details).toContain("wejść");
  });
});

describe("getExpiringMemberships", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries ACTIVE memberships ending within the given window", async () => {
    prismaMock.membership.findMany
      .mockResolvedValueOnce([]) // expireOutdatedMemberships
      .mockResolvedValueOnce([]);

    await getExpiringMemberships(7);

    const where = prismaMock.membership.findMany.mock.calls[1][0].where;
    expect(where.status).toBe("ACTIVE");
    expect(where.member).toEqual({ is: { active: true } });

    const spanInDays = Math.round(
      (where.endDate.lt.getTime() - where.endDate.gte.getTime()) / 86400000,
    );
    expect(spanInDays).toBe(8); // dziś + 7 pełnych dni
  });
});
