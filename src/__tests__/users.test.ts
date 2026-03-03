import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: authMock }));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}));

const prismaMock = vi.hoisted(() => ({
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ default: prismaMock }));

import { getUsers, getUserById, createUser, updateUser } from "@/app/actions/users";

const adminSession = { user: { role: "ADMIN" } };
const receptionSession = { user: { role: "RECEPTION" } };

describe("getUsers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when caller is not ADMIN", async () => {
    authMock.mockResolvedValue(receptionSession);
    await expect(getUsers()).rejects.toThrow("Brak uprawnień administratora");
  });

  it("returns users list for ADMIN", async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.user.findMany.mockResolvedValue([{ id: "u1", username: "admin" }]);

    const result = await getUsers();
    expect(result).toHaveLength(1);
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } }),
    );
  });
});

describe("getUserById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when caller is not ADMIN", async () => {
    authMock.mockResolvedValue(null);
    await expect(getUserById("id")).rejects.toThrow("Brak uprawnień administratora");
  });

  it("finds user by id for ADMIN", async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", username: "test" });

    const result = await getUserById("u1");
    expect(result?.username).toBe("test");
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" } }),
    );
  });
});

describe("createUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when caller is not ADMIN", async () => {
    authMock.mockResolvedValue(receptionSession);
    const fd = new FormData();
    await expect(createUser(fd)).rejects.toThrow("Brak uprawnień administratora");
  });

  it("throws when username is empty", async () => {
    authMock.mockResolvedValue(adminSession);
    const fd = new FormData();
    fd.set("username", "  ");
    fd.set("password", "securepass");
    fd.set("role", "RECEPTION");
    await expect(createUser(fd)).rejects.toThrow("Login jest wymagany");
  });

  it("throws when password is empty", async () => {
    authMock.mockResolvedValue(adminSession);
    const fd = new FormData();
    fd.set("username", "newuser");
    fd.set("password", "");
    fd.set("role", "RECEPTION");
    await expect(createUser(fd)).rejects.toThrow("Hasło jest wymagany");
  });

  it("throws when password is shorter than 6 characters", async () => {
    authMock.mockResolvedValue(adminSession);
    const fd = new FormData();
    fd.set("username", "newuser");
    fd.set("password", "abc");
    fd.set("role", "RECEPTION");
    await expect(createUser(fd)).rejects.toThrow("Hasło musi mieć minimum 6 znaków");
  });

  it("throws when role is invalid", async () => {
    authMock.mockResolvedValue(adminSession);
    const fd = new FormData();
    fd.set("username", "newuser");
    fd.set("password", "securepassword");
    fd.set("role", "SUPERUSER");
    await expect(createUser(fd)).rejects.toThrow("Nieprawidłowa rola użytkownika");
  });

  it("creates user with hashed password for valid input", async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.user.create.mockResolvedValue({ id: "new" });

    const fd = new FormData();
    fd.set("username", "  receptionist  ");
    fd.set("password", "password123");
    fd.set("role", "RECEPTION");

    await createUser(fd);

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        username: "receptionist", // trimmed
        password: "hashed_password",
        role: "RECEPTION",
      },
    });
  });

  it("throws duplicate username error on P2002", async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.user.create.mockRejectedValue({ code: "P2002" });

    const fd = new FormData();
    fd.set("username", "existing");
    fd.set("password", "password123");
    fd.set("role", "ADMIN");

    await expect(createUser(fd)).rejects.toThrow(
      "Użytkownik o takim loginie już istnieje",
    );
  });
});

describe("updateUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when caller is not ADMIN", async () => {
    authMock.mockResolvedValue(receptionSession);
    const fd = new FormData();
    await expect(updateUser("id", fd)).rejects.toThrow("Brak uprawnień administratora");
  });

  it("updates user without changing password when password field is blank", async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.user.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("username", "updateduser");
    fd.set("password", ""); // empty = no change
    fd.set("role", "ADMIN");

    await updateUser("user-id", fd);

    const updateCall = prismaMock.user.update.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("password");
    expect(updateCall.data.username).toBe("updateduser");
    expect(updateCall.data.role).toBe("ADMIN");
  });

  it("updates password when new password is provided", async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.user.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("username", "user");
    fd.set("password", "newpassword");
    fd.set("role", "RECEPTION");

    await updateUser("user-id", fd);

    const updateCall = prismaMock.user.update.mock.calls[0][0];
    expect(updateCall.data.password).toBe("hashed_password");
  });

  it("throws when new password is too short", async () => {
    authMock.mockResolvedValue(adminSession);

    const fd = new FormData();
    fd.set("username", "user");
    fd.set("password", "abc"); // too short
    fd.set("role", "RECEPTION");

    await expect(updateUser("id", fd)).rejects.toThrow(
      "Hasło musi mieć minimum 6 znaków",
    );
  });

  it("throws on duplicate username during update (P2002)", async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.user.update.mockRejectedValue({ code: "P2002" });

    const fd = new FormData();
    fd.set("username", "duplicate");
    fd.set("password", "");
    fd.set("role", "ADMIN");

    await expect(updateUser("id", fd)).rejects.toThrow(
      "Użytkownik o takim loginie już istnieje",
    );
  });
});
