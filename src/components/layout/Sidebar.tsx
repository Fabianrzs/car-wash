"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  Sparkles,
  ClipboardList,
  BarChart3,
  Droplets,
  Menu,
  X,
  Settings,
  UserPlus,
  CreditCard,
  ListTodo,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTenantRole } from "@/hooks/useTenantRole";

const managerNavigation = [
  { name: "Dashboard",  href: "/dashboard", icon: LayoutDashboard },
  { name: "Órdenes",   href: "/orders",    icon: ClipboardList },
  { name: "Clientes",  href: "/clients",   icon: Users },
  { name: "Vehículos", href: "/vehicles",  icon: Car },
  { name: "Servicios", href: "/services",  icon: Sparkles },
];

const employeeNavigation = [
  { name: "Mis Órdenes", href: "/mis-ordenes", icon: ListTodo },
];

function NavItem({
  item,
  onClick,
}: {
  item: { name: string; href: string; icon: React.ElementType };
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname?.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-all duration-150",
        isActive
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
      )}
    >
      <item.icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-white dark:text-zinc-900"
            : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
        )}
      />
      {item.name}
    </Link>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = useTenantRole();

  const isEmployee  = role === "EMPLOYEE";
  const showReports = role === null || role === "OWNER" || role === "ADMIN";
  const showTeam    = role === null || role === "OWNER" || role === "ADMIN";
  const showBilling = role === null || role === "OWNER";

  const configNavigation = isEmployee
    ? []
    : [
        { name: "Ajustes",     href: "/settings", icon: Settings,   show: true },
        { name: "Equipo",      href: "/team",     icon: UserPlus,   show: showTeam },
        { name: "Facturación", href: "/billing",  icon: CreditCard, show: showBilling },
      ];

  const coreNav = isEmployee ? employeeNavigation : managerNavigation;
  const mainNavigation = [
    ...coreNav,
    ...(showReports && !isEmployee
      ? [{ name: "Reportes", href: "/reports", icon: BarChart3 }]
      : []),
  ];

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? (
          <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        ) : (
          <Menu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        )}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm dark:bg-slate-950/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
            <Droplets className="h-4 w-4 text-white dark:text-zinc-900" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Car Wash Pro
          </span>
        </div>

        <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
          {mainNavigation.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              onClick={() => setMobileOpen(false)}
            />
          ))}

          {configNavigation.length > 0 && (
            <>
              <div className="mx-2 my-2 border-t border-slate-100 dark:border-slate-800" />
              <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Configuración
              </p>
            </>
          )}

          {configNavigation
            .filter((item) => item.show)
            .map((item) => (
              <NavItem
                key={item.name}
                item={item}
                onClick={() => setMobileOpen(false)}
              />
            ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <p className="text-[11px] text-slate-400 dark:text-slate-600">
            Car Wash Pro · v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
