import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: authMock }));

const prismaMock = vi.hoisted(() => ({
  membershipType: {
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  membership: {
    count: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ default: prismaMock }));

import {
  getMembershipTypes,
  createMembershipType,
  deleteMembershipType,
} from "@/app/actions/membershipTypes";

const adminSession = { user: { role: "ADMIN" } };
const receptionSession = { user: { role: "RECEPTION" } };

describe("getMembershipTypes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only active membership types", async () => {
    prismaMock.membershipType.findMany.mockResolvedValue([]);
    await getMembershipTypes();
    expect(prismaMock.membershipType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } }),
    );
  });
});

describe("createMembershipType", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws for non-admin", async () => {
    authMock.mockResolvedValue(receptionSession);
    const fd = new FormData();
    await expect(createMembershipType(fd)).rejects.toThrow(
      "Brak uprawnień administratora",
    );
  });

  it("returns an error when required fields are missing", async () => {
    authMock.mockResolvedValue(adminSession);
    const fd = new FormData();
    fd.set("name", "");
    fd.set("scope", "GYM");
    fd.set("type", "TIME");
    fd.set("price", "NaN");
    await expect(createMembershipType(fd)).resolves.toEqual({
      success: false,
      error: "Uzupełnij wszystkie wymagane pola",
    });
  });

  it("returns an error for TIME type without daysValid", async () => {
    authMock.mockResolvedValue(adminSession);
    const fd = new FormData();
    fd.set("name", "Monthly");
    fd.set("scope", "GYM");
    fd.set("type", "TIME");
    fd.set("price", "99");
    // no daysValid
    await expect(createMembershipType(fd)).resolves.toEqual({
      success: false,
      error: "Karnet czasowy wymaga liczby dni ważności",
    });
  });

  it("returns an error for ENTRY type without entries count", async () => {
    authMock.mockResolvedValue(adminSession);
    const fd = new FormData();
    fd.set("name", "10 wejść");
    fd.set("scope", "GYM");
    fd.set("type", "ENTRY");
    fd.set("price", "120");
    // no entries
    await expect(createMembershipType(fd)).resolves.toEqual({
      success: false,
      error: "Karnet wejściowy wymaga liczby wejść",
    });
  });

  it("creates TIME membership type successfully", async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.membershipType.create.mockResolvedValue({ id: "mt1" });

    const fd = new FormData();
    fd.set("name", "Miesięczny");
    fd.set("scope", "GYM");
    fd.set("type", "TIME");
    fd.set("price", "99");
    fd.set("daysValid", "30");

    await createMembershipType(fd);

    expect(prismaMock.membershipType.create).toHaveBeenCalledWith({
      data: {
        name: "Miesięczny",
        scope: "GYM",
        type: "TIME",
        price: 99,
        daysValid: 30,
        entries: null,
      },
    });
  });

  it("defaults ENTRY membership type validity to 30 days", async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.membershipType.create.mockResolvedValue({ id: "mt2" });

    const fd = new FormData();
    fd.set("name", "10 wejść");
    fd.set("scope", "ALL");
    fd.set("type", "ENTRY");
    fd.set("price", "120");
    fd.set("entries", "10");

    await createMembershipType(fd);

    expect(prismaMock.membershipType.create).toHaveBeenCalledWith({
      data: {
        name: "10 wejść",
        scope: "ALL",
        type: "ENTRY",
        price: 120,
        daysValid: 30,
        entries: 10,
      },
    });
  });
});

describe("deleteMembershipType", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws for non-admin", async () => {
    authMock.mockResolvedValue(receptionSession);
    await expect(deleteMembershipType("id")).rejects.toThrow(
      "Brak uprawnień administratora",
    );
  });

  it("returns an error when membership type is linked to existing memberships", async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.membership.count.mockResolvedValue(3);

    await expect(deleteMembershipType("type-with-sales")).resolves.toEqual({
      success: false,
      error: "Nie można usunąć karnetu, który był już sprzedany.",
    });
    expect(prismaMock.membershipType.delete).not.toHaveBeenCalled();
  });

  it("deletes membership type when no memberships are linked", async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.membership.count.mockResolvedValue(0);
    prismaMock.membershipType.delete.mockResolvedValue({ id: "mt1" });

    await deleteMembershipType("mt1");

    expect(prismaMock.membershipType.delete).toHaveBeenCalledWith({
      where: { id: "mt1" },
    });
  });
});
