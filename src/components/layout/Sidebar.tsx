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
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Vehiculos", href: "/vehicles", icon: Car },
  { name: "Servicios", href: "/services", icon: Sparkles },
  { name: "Ordenes", href: "/orders", icon: ClipboardList },
];

const employeeNavigation = [
  { name: "Mis Órdenes", href: "/mis-ordenes", icon: ListTodo },
  { name: "Ordenes", href: "/orders", icon: ClipboardList },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = useTenantRole();

  // Fail-open: show all items while loading (role === null)
  const isEmployee = role === "EMPLOYEE";
  const showReports = role === null || role === "OWNER" || role === "ADMIN";
  const showTeam = role === null || role === "OWNER" || role === "ADMIN";
  const showBilling = role === null || role === "OWNER";

  const configNavigation = [
    { name: "Ajustes", href: "/settings", icon: Settings, show: true },
    { name: "Equipo", href: "/team", icon: UserPlus, show: showTeam },
    { name: "Facturacion", href: "/billing", icon: CreditCard, show: showBilling },
  ];

  const coreNav = isEmployee ? employeeNavigation : managerNavigation;

  const mainNavigation = [
    ...coreNav,
    ...(showReports ? [{ name: "Reportes", href: "/reports", icon: BarChart3 }] : []),
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-md bg-white p-2 shadow-md md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? (
          <X className="h-5 w-5 text-gray-600" />
        ) : (
          <Menu className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* App name */}
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
          <Droplets className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Car Wash</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4">
          {mainNavigation.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-blue-700" : "text-gray-400"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Separator */}
          <div className="my-2 border-t border-gray-200" />
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Configuracion
          </p>

          {configNavigation.filter((item) => item.show).map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-blue-700" : "text-gray-400"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
