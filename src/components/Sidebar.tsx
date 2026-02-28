"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  userName?: string | null;
  userRole?: string | null;
}

function getInitials(name?: string | null) {
  if (!name) return "??";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials.slice(0, 2) || "??";
}

function getRoleLabel(role?: string | null) {
  if (role === "ADMIN") return "Administrator";
  if (role === "RECEPTION") return "Recepcjonista";
  return "Użytkownik";
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "ADMIN";

  const links = [
    { href: "/dashboard", label: "Panel", icon: "📊" },
    { href: "/checkin", label: "Wejście", icon: "✅" },
    { href: "/members", label: "Klubowicze", icon: "👥" },
    { href: "/pos", label: "Sprzedaż", icon: "🛒" },
  ];

  const adminLinks = [
    { href: "/products", label: "Magazyn", icon: "📦" },
    { href: "/admin/memberships", label: "Karnety", icon: "🎫" },
    { href: "/reports", label: "Raporty", icon: "📈" },
    { href: "/admin/users", label: "Użytkownicy", icon: "👤" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Athletic Club</h1>
        <p className="text-xs text-muted">Recepcja</p>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <div className="nav-submenu">
            <div className="nav-submenu-title">
              <span className="nav-icon">⚙️</span>
              <span className="font-medium">Admin</span>
            </div>
            {adminLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link nav-link-sub ${isActive ? "active" : ""}`}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="card p-4 flex flex-col gap-3">
          <div className="user-card">
            <div className="avatar">{getInitials(userName)}</div>
            <div className="w-full">
              <p className="text-sm font-medium text-white text-ellipsis">
                {userName || "Nieznany użytkownik"}
              </p>
              <p className="text-xs text-muted">{getRoleLabel(userRole)}</p>
            </div>
          </div>
          <form
            action={async () => {
              const { logout } = await import("@/app/actions/auth");
              await logout();
            }}
          >
            <button className="btn btn-ghost w-full justify-start text-xs p-2">
              🚪 Wyloguj się
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
