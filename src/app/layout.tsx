import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Athletic Club Recepcja",
  description: "Gym Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    return (
      <html lang="pl">
        <body className={inter.className}>{children}</body>
      </html>
    );
  }

  return (
    <html lang="pl">
      <body className={inter.className}>
        <div className="app-container">
          <Sidebar
            userName={session.user?.name}
            userRole={session.user?.role}
          />
          <main className="main-content fade-in">{children}</main>
        </div>
      </body>
    </html>
  );
}
