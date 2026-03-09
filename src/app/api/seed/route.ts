import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    // Check if data exists - let's find user 'admin' specifically
    const adminUser = await prisma.user.findUnique({
      where: { username: "admin" },
    });

    if (adminUser) {
      return NextResponse.json({
        message: "Database already seeded",
      });
    }

    const hashedPassword = await bcrypt.hash("recepcja_dev_2024", 10);
    const hashedAdminPassword = await bcrypt.hash("admin_dev_2024", 10);

    // Create Membership Types
    await prisma.membershipType.createMany({
      data: [
        {
          name: "Karnet Open (30 dni)",
          scope: "GYM",
          type: "TIME",
          daysValid: 30,
          price: 159.0,
        },
        {
          name: "Karnet Open (90 dni)",
          scope: "GYM",
          type: "TIME",
          daysValid: 90,
          price: 399.0,
        },
        {
          name: "Karnet 10 Wejść",
          scope: "GYM",
          type: "ENTRY",
          entries: 10,
          price: 180.0,
        },
        {
          name: "Karnet Zajęcia (30 dni)",
          scope: "CLASSES",
          type: "TIME",
          daysValid: 30,
          price: 199.0,
        },
      ],
    });

    // Create Products
    await prisma.product.createMany({
      data: [
        { name: "Woda 0.5l", category: "DRINKS", price: 5.0, stock: 100 },
        { name: "Izotonik", category: "DRINKS", price: 8.0, stock: 50 },
        {
          name: "Białko (porcja)",
          category: "SUPPLEMENTS",
          price: 12.0,
          stock: 200,
        },
        {
          name: "Baton Proteinowy",
          category: "SUPPLEMENTS",
          price: 10.0,
          stock: 40,
        },
        {
          name: "Ręcznik (wypożyczenie)",
          category: "OTHER",
          price: 15.0,
          stock: 0,
        },
      ],
    });

    // Create Reception User
    await prisma.user.create({
      data: {
        username: "recepcja",
        password: hashedPassword,
        role: "RECEPTION",
      },
    });

    // Create Admin User
    await prisma.user.create({
      data: {
        username: "admin",
        password: hashedAdminPassword,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      message: "Database seeded successfully with hashed passwords",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Seeding failed" }, { status: 500 });
  }
}
