import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const prismaMock = vi.hoisted(() => ({
  member: {
    findMany: vi.fn(),
  },
  membership: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ default: prismaMock }));

import { findMemberForCheckin, registerVisit } from "@/app/actions/checkin";

describe("findMemberForCheckin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("searches by phoneNumber and lastName, only active members", async () => {
    prismaMock.member.findMany.mockResolvedValue([]);
    await findMemberForCheckin("Anna");

    expect(prismaMock.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { phoneNumber: { contains: "Anna" } },
            { lastName: { contains: "Anna" } },
          ],
          active: true,
        },
        take: 5,
      }),
    );
  });

  it("returns up to 5 results", async () => {
    prismaMock.member.findMany.mockResolvedValue([]);
    await findMemberForCheckin("test");
    const call = prismaMock.member.findMany.mock.calls[0][0];
    expect(call.take).toBe(5);
  });
});

describe("registerVisit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when membership not found", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);
    const result = await registerVisit("memberId", "membershipId");
    expect(result).toEqual({
      success: false,
      message: "Invalid or inactive membership",
    });
  });

  it("returns failure when membership is not ACTIVE", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      id: "ms1",
      status: "EXPIRED",
      type: { type: "TIME" },
      endDate: null,
      remainingEntries: null,
    });
    const result = await registerVisit("m", "ms1");
    expect(result).toEqual({
      success: false,
      message: "Invalid or inactive membership",
    });
  });

  it("auto-expires and returns failure when TIME membership is past endDate", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      id: "ms1",
      status: "ACTIVE",
      type: { type: "TIME" },
      endDate: new Date("2020-01-01"), // clearly in the past
      remainingEntries: null,
    });
    prismaMock.membership.update.mockResolvedValue({});

    const result = await registerVisit("m", "ms1");

    expect(prismaMock.membership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ms1" },
        data: expect.objectContaining({ status: "EXPIRED" }),
      }),
    );
    expect(result).toEqual({ success: false, message: "Membership expired" });
  });

  it("returns failure when ENTRY membership has 0 remaining entries", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      id: "ms1",
      status: "ACTIVE",
      type: { type: "ENTRY" },
      endDate: null,
      remainingEntries: 0,
    });

    const result = await registerVisit("m", "ms1");
    expect(result).toEqual({
      success: false,
      message: "No entries remaining",
    });
    expect(prismaMock.membership.update).not.toHaveBeenCalled();
  });

  it("decrements entries for ENTRY membership and returns success", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      id: "ms1",
      status: "ACTIVE",
      type: { type: "ENTRY" },
      endDate: null,
      remainingEntries: 5,
    });
    prismaMock.membership.update.mockResolvedValue({});

    const result = await registerVisit("memberId", "ms1");

    expect(prismaMock.membership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          remainingEntries: { decrement: 1 },
        }),
      }),
    );
    expect(result).toEqual({ success: true, message: "Visit registered" });
  });

  it("logs visit for TIME membership without decrementing entries", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      id: "ms1",
      status: "ACTIVE",
      type: { type: "TIME" },
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days future
      remainingEntries: null,
    });
    prismaMock.membership.update.mockResolvedValue({});

    const result = await registerVisit("memberId", "ms1");

    const updateCall = prismaMock.membership.update.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("remainingEntries");
    expect(updateCall.data.history.create.action).toBe("USE_ENTRY");
    expect(result).toEqual({ success: true, message: "Visit registered" });
  });
});
