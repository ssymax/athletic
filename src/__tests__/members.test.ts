import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const prismaMock = vi.hoisted(() => ({
  member: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  membership: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  membershipHistory: {
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ default: prismaMock }));

import {
  getMembers,
  createMember,
  updateMember,
  getMember,
  deleteMember,
} from "@/app/actions/members";

function makeMembership(overrides: {
  id?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date | null;
  remainingEntries?: number | null;
}) {
  return {
    id: overrides.id ?? "m1",
    type: { type: overrides.type ?? "TIME", name: "Standard" },
    startDate: overrides.startDate ?? new Date("2025-01-01"),
    endDate: overrides.endDate ?? new Date("2025-02-01"),
    remainingEntries: overrides.remainingEntries ?? null,
  };
}

describe("getMembers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches all members without query", async () => {
    prismaMock.member.findMany.mockResolvedValue([]);
    const result = await getMembers();
    expect(prismaMock.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
    expect(result).toEqual([]);
  });

  it("passes query filter when provided", async () => {
    prismaMock.member.findMany.mockResolvedValue([]);
    await getMembers("Anna");
    const call = prismaMock.member.findMany.mock.calls[0][0];
    expect(call.where.OR).toHaveLength(3);
    expect(call.where.OR[0]).toEqual({ firstName: { contains: "Anna" } });
  });

  it("attaches primaryMembership: null when no memberships", async () => {
    prismaMock.member.findMany.mockResolvedValue([
      { id: "1", firstName: "Jan", memberships: [] },
    ]);
    const [member] = await getMembers();
    expect(member.primaryMembership).toBeNull();
  });

  it("prefers TIME-based membership over ENTRY-based", async () => {
    const timeMembership = makeMembership({
      id: "t1",
      type: "TIME",
      endDate: new Date("2025-06-01"),
    });
    const entryMembership = makeMembership({
      id: "e1",
      type: "ENTRY",
      endDate: null,
      remainingEntries: 10,
    });

    prismaMock.member.findMany.mockResolvedValue([
      {
        id: "1",
        firstName: "Jan",
        memberships: [entryMembership, timeMembership],
      },
    ]);
    const [member] = await getMembers();
    expect(member.primaryMembership?.id).toBe("t1");
  });

  it("picks TIME membership with earliest endDate first", async () => {
    const soonExpiring = makeMembership({
      id: "soon",
      type: "TIME",
      endDate: new Date("2025-03-01"),
    });
    const laterExpiring = makeMembership({
      id: "later",
      type: "TIME",
      endDate: new Date("2025-12-01"),
    });

    prismaMock.member.findMany.mockResolvedValue([
      {
        id: "1",
        firstName: "Jan",
        memberships: [laterExpiring, soonExpiring],
      },
    ]);
    const [member] = await getMembers();
    expect(member.primaryMembership?.id).toBe("soon");
  });

  it("picks ENTRY membership with fewest remaining entries first", async () => {
    const almostDone = makeMembership({
      id: "low",
      type: "ENTRY",
      endDate: null,
      remainingEntries: 1,
    });
    const plenty = makeMembership({
      id: "high",
      type: "ENTRY",
      endDate: null,
      remainingEntries: 20,
    });

    prismaMock.member.findMany.mockResolvedValue([
      { id: "1", firstName: "Jan", memberships: [plenty, almostDone] },
    ]);
    const [member] = await getMembers();
    expect(member.primaryMembership?.id).toBe("low");
  });
});

describe("createMember", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when required fields are missing", async () => {
    const fd = new FormData();
    fd.set("firstName", "");
    fd.set("lastName", "Kowalski");
    fd.set("phoneNumber", "");

    await expect(createMember(fd)).rejects.toThrow(
      "Please fill in all required fields",
    );
  });

  it("creates member and returns success", async () => {
    prismaMock.member.create.mockResolvedValue({ id: "new" });

    const fd = new FormData();
    fd.set("firstName", "Anna");
    fd.set("lastName", "Nowak");
    fd.set("phoneNumber", "123456789");
    fd.set("notes", "VIP");

    const result = await createMember(fd);
    expect(result).toEqual({ success: true });
    expect(prismaMock.member.create).toHaveBeenCalledWith({
      data: {
        firstName: "Anna",
        lastName: "Nowak",
        phoneNumber: "123456789",
        notes: "VIP",
      },
    });
  });
});

describe("updateMember", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates member fields", async () => {
    prismaMock.member.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("firstName", "Piotr");
    fd.set("lastName", "Wiśniewski");
    fd.set("phoneNumber", "987654321");
    fd.set("notes", "");
    fd.set("active", "on");

    const result = await updateMember("member-id", fd);
    expect(result).toEqual({ success: true });
    expect(prismaMock.member.update).toHaveBeenCalledWith({
      where: { id: "member-id" },
      data: {
        firstName: "Piotr",
        lastName: "Wiśniewski",
        phoneNumber: "987654321",
        notes: "",
        active: true,
      },
    });
  });

  it("sets active to false when checkbox is not 'on'", async () => {
    prismaMock.member.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("firstName", "Piotr");
    fd.set("lastName", "W");
    fd.set("phoneNumber", "1");
    fd.set("notes", "");
    // no "active" entry → formData.get returns null → active = false

    await updateMember("id", fd);
    const data = prismaMock.member.update.mock.calls[0][0].data;
    expect(data.active).toBe(false);
  });
});

describe("getMember", () => {
  it("calls findUnique with correct id and includes", async () => {
    prismaMock.member.findUnique.mockResolvedValue(null);
    await getMember("abc");
    expect(prismaMock.member.findUnique).toHaveBeenCalledWith({
      where: { id: "abc" },
      include: expect.objectContaining({ memberships: expect.any(Object) }),
    });
  });
});

describe("deleteMember", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs transaction to cascade delete memberships and member", async () => {
    prismaMock.membership.findMany.mockResolvedValue([
      { id: "ms1" },
      { id: "ms2" },
    ]);

    prismaMock.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<void>) => {
        const tx = {
          membershipHistory: { deleteMany: vi.fn().mockResolvedValue({}) },
          membership: { deleteMany: vi.fn().mockResolvedValue({}) },
          member: { delete: vi.fn().mockResolvedValue({}) },
        };
        await cb(tx);
        expect(tx.membershipHistory.deleteMany).toHaveBeenCalledWith({
          where: { membershipId: { in: ["ms1", "ms2"] } },
        });
        expect(tx.membership.deleteMany).toHaveBeenCalledWith({
          where: { memberId: "member-id" },
        });
        expect(tx.member.delete).toHaveBeenCalledWith({
          where: { id: "member-id" },
        });
      },
    );

    await deleteMember("member-id");
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it("skips history delete when member has no memberships", async () => {
    prismaMock.membership.findMany.mockResolvedValue([]);

    prismaMock.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<void>) => {
        const tx = {
          membershipHistory: { deleteMany: vi.fn().mockResolvedValue({}) },
          membership: { deleteMany: vi.fn().mockResolvedValue({}) },
          member: { delete: vi.fn().mockResolvedValue({}) },
        };
        await cb(tx);
        expect(tx.membershipHistory.deleteMany).not.toHaveBeenCalled();
      },
    );

    await deleteMember("member-no-memberships");
  });
});
