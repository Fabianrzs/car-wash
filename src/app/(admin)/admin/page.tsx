"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Activity,
  ExternalLink,
} from "lucide-react";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
const PROTOCOL = APP_DOMAIN.includes("localhost") ? "http" : "https";

interface RecentTenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  plan: { name: string } | null;
  _count: { serviceOrders: number; clients: number; tenantUsers: number };
}

interface Stats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalOrders: number;
  mrr: number;
  tenantsThisMonth: number;
  tenantGrowth: number;
  recentTenants: RecentTenant[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const kpis = [
    {
      label: "Total Tenants",
      value: stats.totalTenants,
      icon: Building2,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Tenants Activos",
      value: stats.activeTenants,
      icon: Activity,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "MRR",
      value: `$${stats.mrr.toLocaleString("es-CO")}`,
      icon: DollarSign,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Usuarios Totales",
      value: stats.totalUsers,
      icon: Users,
      color: "text-orange-600 bg-orange-100",
    },
    {
      label: "Ordenes Totales",
      value: stats.totalOrders.toLocaleString(),
      icon: ClipboardList,
      color: "text-cyan-600 bg-cyan-100",
    },
    {
      label: "Crecimiento Mensual",
      value: `${stats.tenantGrowth > 0 ? "+" : ""}${stats.tenantGrowth}%`,
      icon: TrendingUp,
      color:
        stats.tenantGrowth >= 0
          ? "text-green-600 bg-green-100"
          : "text-red-600 bg-red-100",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Panel de Administracion
      </h1>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tenants */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 md:px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Lavaderos Recientes
          </h2>
          <Link
            href="/admin/tenants"
            className="text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recentTenants.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-500">
              No hay lavaderos registrados
            </p>
          ) : (
            stats.recentTenants.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <Link
                      href={`/admin/tenants/${t.id}`}
                      className="font-medium text-gray-900 hover:text-purple-700"
                    >
                      {t.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {t.slug} &middot; {t.plan?.name || "Sin plan"} &middot;{" "}
                      {t._count.clients} clientes &middot;{" "}
                      {t._count.serviceOrders} ordenes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {t.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <a
                    href={`${PROTOCOL}://${t.slug}.${APP_DOMAIN}/dashboard`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Gestionar
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
