"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Brak uprawnień administratora");
  }
}

function normalizeDateRange(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const [earlier, later] = start <= end ? [start, end] : [end, start];

  earlier.setHours(0, 0, 0, 0);
  later.setHours(23, 59, 59, 999);

  return { startOfRange: earlier, endOfRange: later };
}

export async function getSalesReport(startDate: Date, endDate: Date) {
  await assertAdmin();

  const { startOfRange, endOfRange } = normalizeDateRange(startDate, endDate);

  // Product Sales
  const productSales = await prisma.sale.findMany({
    where: {
      date: {
        gte: startOfRange,
        lte: endOfRange,
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Membership Sales
  const membershipSales = await prisma.membership.findMany({
    where: {
      createdAt: {
        // Using createdAt as purchase date
        gte: startOfRange,
        lte: endOfRange,
      },
    },
    include: { type: true },
  });

  const report = {
    totalSales: 0,
    cashTotal: 0,
    cardTotal: 0,
    productsTotal: 0,
    membershipsTotal: 0,
    membershipsCount: membershipSales.length,
    salesCount: productSales.length,
    productsList: [] as Array<{
      id: string;
      name: string;
      quantity: number;
      revenue: number;
    }>,
    membershipsList: [] as Array<{
      id: string;
      name: string;
      type: string;
      count: number;
      revenue: number;
    }>,
    byMethod: {
      CASH: 0,
      CARD: 0,
    },
  };

  const productsMap = new Map<
    string,
    {
      id: string;
      name: string;
      quantity: number;
      revenue: number;
    }
  >();

  const membershipsMap = new Map<
    string,
    {
      id: string;
      name: string;
      type: string;
      count: number;
      revenue: number;
    }
  >();

  // Process Product Sales
  productSales.forEach((sale) => {
    report.totalSales += sale.totalAmount;
    report.productsTotal += sale.totalAmount;
    if (sale.paymentMethod === "CASH") {
      report.cashTotal += sale.totalAmount;
      report.byMethod.CASH += sale.totalAmount;
    } else {
      report.cardTotal += sale.totalAmount;
      report.byMethod.CARD += sale.totalAmount;
    }

    sale.items.forEach((item) => {
      const existing = productsMap.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.total;
        return;
      }

      productsMap.set(item.productId, {
        id: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        revenue: item.total,
      });
    });
  });

  // Process Membership Sales
  membershipSales.forEach((membership) => {
    report.totalSales += membership.pricePaid;
    report.membershipsTotal += membership.pricePaid;
    if (membership.paymentMethod === "CASH") {
      report.cashTotal += membership.pricePaid;
      report.byMethod.CASH += membership.pricePaid;
    } else {
      report.cardTotal += membership.pricePaid;
      report.byMethod.CARD += membership.pricePaid;
    }

    const existing = membershipsMap.get(membership.typeId);
    if (existing) {
      existing.count += 1;
      existing.revenue += membership.pricePaid;
      return;
    }

    membershipsMap.set(membership.typeId, {
      id: membership.typeId,
      name: membership.type.name,
      type: membership.type.type,
      count: 1,
      revenue: membership.pricePaid,
    });
  });

  report.productsList = Array.from(productsMap.values()).sort((a, b) => {
    if (b.revenue !== a.revenue) return b.revenue - a.revenue;
    return b.quantity - a.quantity;
  });

  report.membershipsList = Array.from(membershipsMap.values()).sort((a, b) => {
    if (b.revenue !== a.revenue) return b.revenue - a.revenue;
    return b.count - a.count;
  });

  return report;
}

export async function getExpiringMemberships(days: number = 7) {
  await assertAdmin();

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  return await prisma.membership.findMany({
    where: {
      endDate: {
        gte: today,
        lte: futureDate,
      },
      status: "ACTIVE",
    },
    include: {
      member: true,
      type: true,
    },
    orderBy: {
      endDate: "asc",
    },
  });
}
