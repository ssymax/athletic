import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const txMock = vi.hoisted(() => ({
  sale: { create: vi.fn() },
  product: { update: vi.fn() },
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ default: prismaMock }));

import { processSale } from "@/app/actions/pos";

describe("processSale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<void>) => {
        txMock.sale.create.mockResolvedValue({});
        txMock.product.update.mockResolvedValue({});
        await cb(txMock);
      },
    );
  });

  it("throws when cart is empty", async () => {
    await expect(processSale([], "CASH")).rejects.toThrow("Cart is empty");
  });

  it("creates Sale record with correct totalAmount", async () => {
    const items = [
      { productId: "p1", quantity: 2, price: 10 },
      { productId: "p2", quantity: 1, price: 25 },
    ];

    const result = await processSale(items, "CARD");

    expect(result).toEqual({ success: true });

    const saleCreateCall = txMock.sale.create.mock.calls[0][0];
    expect(saleCreateCall.data.totalAmount).toBe(45); // 2*10 + 1*25
    expect(saleCreateCall.data.paymentMethod).toBe("CARD");
  });

  it("creates SaleItems with correct unit prices and totals", async () => {
    const items = [{ productId: "p1", quantity: 3, price: 8 }];

    await processSale(items, "CASH");

    const saleCreateCall = txMock.sale.create.mock.calls[0][0];
    expect(saleCreateCall.data.items.create).toEqual([
      {
        productId: "p1",
        quantity: 3,
        unitPrice: 8,
        total: 24,
      },
    ]);
  });

  it("decrements stock for each product in the cart", async () => {
    const items = [
      { productId: "p1", quantity: 2, price: 10 },
      { productId: "p2", quantity: 5, price: 5 },
    ];

    await processSale(items, "CASH");

    expect(txMock.product.update).toHaveBeenCalledTimes(2);
    expect(txMock.product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { stock: { decrement: 2 } },
    });
    expect(txMock.product.update).toHaveBeenCalledWith({
      where: { id: "p2" },
      data: { stock: { decrement: 5 } },
    });
  });

  it("passes optional note to sale", async () => {
    const items = [{ productId: "p1", quantity: 1, price: 15 }];

    await processSale(items, "CASH", "special order");

    const saleCreateCall = txMock.sale.create.mock.calls[0][0];
    expect(saleCreateCall.data.note).toBe("special order");
  });

  it("handles single item with correct total calculation", async () => {
    const items = [{ productId: "p1", quantity: 1, price: 99.99 }];

    await processSale(items, "CARD");

    const saleCreateCall = txMock.sale.create.mock.calls[0][0];
    expect(saleCreateCall.data.totalAmount).toBeCloseTo(99.99);
  });
});
