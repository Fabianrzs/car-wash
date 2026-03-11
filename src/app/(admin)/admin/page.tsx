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
} from "lucide-react";

import ManageTenantButton from "@/components/admin/ManageTenantButton";
import { PageLoader } from "@/components/ui/Spinner";

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
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("Error al cargar estadisticas");
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar estadisticas"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-800 dark:bg-rose-900/20">
        <p className="text-rose-700 dark:text-rose-400">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const kpis = [
    { label: "Total Tenants", value: stats.totalTenants, icon: Building2 },
    { label: "Tenants Activos", value: stats.activeTenants, icon: Activity },
    { label: "MRR", value: `$${stats.mrr.toLocaleString("es-CO")}`, icon: DollarSign },
    { label: "Usuarios Totales", value: stats.totalUsers, icon: Users },
    { label: "Ordenes Totales", value: stats.totalOrders.toLocaleString(), icon: ClipboardList },
    {
      label: "Crecimiento Mensual",
      value: `${stats.tenantGrowth > 0 ? "+" : ""}${stats.tenantGrowth}%`,
      icon: TrendingUp,
      positive: stats.tenantGrowth >= 0,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Panel de Administracion
      </h1>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                <kpi.icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tenants */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 md:px-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Lavaderos Recientes
          </h2>
          <Link
            href="/admin/tenants"
            className="text-sm font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
          >
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {stats.recentTenants.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No hay lavaderos registrados
            </p>
          ) : (
            stats.recentTenants.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                    <Building2 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                  </div>
                  <div>
                    <Link
                      href={`/admin/tenants/${t.id}`}
                      className="font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
                    >
                      {t.name}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
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
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                    }`}
                  >
                    {t.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <ManageTenantButton slug={t.slug} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
