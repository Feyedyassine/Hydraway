"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Package, ShoppingCart, Users, LogOut, Menu, X, LayoutDashboard, MessageSquare, UserCog, User, Tag, Sparkles } from "lucide-react";
import Image from "next/image";
import { ToastProvider } from "./toast";

type Role = "admin" | "warehouse" | "support";

interface User {
  userId: number;
  name?: string;
  email: string;
  role: Role;
}

const NAV_ITEMS: { href: string; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/admin", label: "Orders", icon: ShoppingCart, roles: ["admin", "warehouse"] },
  { href: "/admin/products", label: "Products", icon: Package, roles: ["admin"] },
  { href: "/admin/clients", label: "Clients", icon: Users, roles: ["admin", "support"] },
  { href: "/admin/promotions", label: "Promotions", icon: Sparkles, roles: ["admin"] },
  { href: "/admin/promos", label: "Promo Codes", icon: Tag, roles: ["admin"] },
  { href: "/admin/contact", label: "Messages", icon: MessageSquare, roles: ["admin", "support"] },
  { href: "/admin/users", label: "Team", icon: UserCog, roles: ["admin"] },
  { href: "/admin/profile", label: "My Profile", icon: User, roles: ["admin", "warehouse", "support"] },
];

const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  warehouse: "/admin",
  support: "/admin/clients",
};

// Which nav section does a path belong to? Longest href prefix wins,
// so /admin/orders/new maps to /admin (Orders), not nothing.
function sectionFor(pathname: string) {
  return NAV_ITEMS
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/") || (i.href === "/admin" && pathname.startsWith("/admin/orders")))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data.user))
      .catch(() => {
        if (!pathname.includes("/admin/login")) {
          router.push("/admin/login");
        }
      })
      .finally(() => setLoading(false));
  }, [router, pathname]);

  // Redirect users who land on a page their role can't access
  useEffect(() => {
    if (!user || pathname.includes("/admin/login")) return;
    const section = sectionFor(pathname);
    if (section && !section.roles.includes(user.role)) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, pathname, router]);

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  // Login page renders without the sidebar shell
  if (pathname.includes("/admin/login")) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!user) return null;

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed z-40 flex h-full w-64 flex-col bg-gray-900 text-white transition-transform md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <Image src="/Logo_white.svg" alt="HydraWay" width={120} height={34} className="h-7 w-auto" />
            <button onClick={() => setSidebarOpen(false)} className="md:hidden">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-3">
            {visibleNav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <a
                  key={href}
                  href={href}
                  className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </a>
              );
            })}
          </nav>

          <div className="border-t border-white/10 px-3 py-4">
            <div className="mb-3 px-3">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar (mobile) */}
          <header className="flex items-center gap-4 border-b bg-white px-4 py-3 md:hidden">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <span className="text-sm font-bold">HydraWay Admin</span>
          </header>

          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
