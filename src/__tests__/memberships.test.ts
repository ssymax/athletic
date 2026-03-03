import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const prismaMock = vi.hoisted(() => ({
  membershipType: {
    findUnique: vi.fn(),
  },
  membership: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ default: prismaMock }));

import { sellMembership } from "@/app/actions/memberships";

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

  it("creates ENTRY membership with remainingEntries and null endDate", async () => {
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
    expect(createData.endDate).toBeNull();
    expect(createData.pricePaid).toBe(120);
    expect(createData.paymentMethod).toBe("CARD");
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
