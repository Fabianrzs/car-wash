"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DollarSign, ClipboardList, Clock, Users, Wallet, BadgeDollarSign } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import PageHeader from "@/components/layout/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils/constants";
import { fetchApi } from "@/lib/utils/api";
import { useTenantRole } from "@/hooks/useTenantRole";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ReportStats {
  totalIncome: number;
  orderCount: number;
  inProgressOrders: number;
  uniqueClients: number;
  completedOrders: number;
  averageOrderValue: number;
  topServices: Array<{ name: string; totalQuantity: number; totalRevenue: number }>;
  dailyBreakdown: Array<{ date: string; income: number; orders: number }>;
  topEmployees?: Array<{ userId: string; name: string | null; completedOrders: number; totalRevenue: number }>;
}

interface CommissionStats {
  totalPending: number;
  totalPaid: number;
  pendingCount: number;
  commissionRate: number;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string | number;
  status: string;
  createdAt: string;
  client: { firstName: string; lastName: string };
  vehicle: { plate: string; brand: string; model: string };
  items: { serviceType: { name: string } }[];
}

function shortDate(dateStr: string) {
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return dateStr;
}

const CHART_COLORS = ["#18181b", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-800">
      <p className="font-medium text-slate-700 dark:text-slate-300">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: p.color }} className="mt-0.5">
          {p.name}: <span className="font-semibold">{p.name === "Órdenes" ? p.value : formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const role = useTenantRole();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<ReportStats | null>(null);
  const [commissionStats, setCommissionStats] = useState<CommissionStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role === "EMPLOYEE") router.replace("/mis-ordenes");
  }, [role, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dailyData, weeklyData, ordersData, commissionData] = await Promise.all([
          fetchApi<ReportStats>("/api/reports?period=daily").catch(() => null),
          fetchApi<ReportStats>("/api/reports?period=weekly").catch(() => null),
          fetchApi<{ orders: Order[] }>("/api/orders?page=1").catch(() => null),
          fetchApi<CommissionStats>("/api/commissions/stats").catch(() => null),
        ]);
        if (dailyData) setStats(dailyData);
        else setError("No se pudieron cargar las estadísticas del día.");
        if (weeklyData) setWeeklyStats(weeklyData);
        if (ordersData) setRecentOrders((ordersData.orders || []).slice(0, 10));
        if (commissionData) setCommissionStats(commissionData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Compute trend vs yesterday from weekly breakdown
  const weeklyBreakdown = weeklyStats?.dailyBreakdown ?? [];
  const todayData = weeklyBreakdown[weeklyBreakdown.length - 1];
  const yesterdayData = weeklyBreakdown[weeklyBreakdown.length - 2];

  const incomeTrend = yesterdayData && yesterdayData.income > 0
    ? { value: Math.abs(((todayData?.income ?? 0) - yesterdayData.income) / yesterdayData.income) * 100, isPositive: (todayData?.income ?? 0) >= yesterdayData.income }
    : undefined;

  const ordersTrend = yesterdayData && yesterdayData.orders > 0
    ? { value: Math.abs(((todayData?.orders ?? 0) - yesterdayData.orders) / yesterdayData.orders) * 100, isPositive: (todayData?.orders ?? 0) >= yesterdayData.orders }
    : undefined;

  const topServices = weeklyStats?.topServices ?? [];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <OnboardingTour flowKey="dashboard" />
      <PageHeader
        title="Panel de Control"
        description="Resumen operativo del día"
      />

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {/* KPI Cards */}
      <div data-onboarding="dashboard-stats" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Ingresos Hoy"
          value={formatCurrency(stats?.totalIncome || 0)}
          icon={DollarSign}
          description="Total facturado del día"
          trend={incomeTrend}
        />
        <StatsCard
          title="Órdenes Hoy"
          value={stats?.orderCount || 0}
          icon={ClipboardList}
          description="Órdenes registradas hoy"
          trend={ordersTrend}
        />
        <StatsCard
          title="En Proceso"
          value={stats?.inProgressOrders || 0}
          icon={Clock}
          description="Órdenes en curso"
        />
        <StatsCard
          title="Clientes Atendidos"
          value={stats?.uniqueClients || 0}
          icon={Users}
          description="Clientes únicos del día"
        />
      </div>

      {/* Charts row 1: ComposedChart + Status Pie */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {weeklyBreakdown.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Ingresos y Órdenes — últimos 7 días</h3>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart
                data={weeklyBreakdown.map((d) => ({ date: shortDate(d.date), income: d.income, orders: d.orders }))}
                margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={44} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={28} />
                <Tooltip content={<CurrencyTooltip />} />
                <Bar yAxisId="left" dataKey="income" name="Ingresos" fill="#18181b" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" dataKey="orders" name="Órdenes" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts row 2: Top services + Employee leaderboard */}
      {(topServices.length > 0 || (weeklyStats?.topEmployees ?? []).length > 0) && (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {topServices.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Servicios más vendidos — semana</h3>
              <ResponsiveContainer width="100%" height={topServices.length > 3 ? 180 : 120}>
                <BarChart
                  layout="vertical"
                  data={topServices.slice(0, 5).map((s) => ({
                    name: s.name.length > 20 ? s.name.slice(0, 20) + "…" : s.name,
                    revenue: s.totalRevenue,
                    qty: s.totalQuantity,
                  }))}
                  margin={{ top: 4, right: 16, bottom: 0, left: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="revenue" name="Ingresos" radius={[0, 3, 3, 0]}>
                    {topServices.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {(weeklyStats?.topEmployees ?? []).length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Rendimiento lavadores — semana</h3>
              <div className="space-y-3">
                {(weeklyStats?.topEmployees ?? []).map((emp, i) => {
                  const maxOrders = (weeklyStats?.topEmployees ?? [])[0]?.completedOrders || 1;
                  return (
                    <div key={emp.userId}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {i + 1}
                          </span>
                          <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                            {emp.name ?? "Sin nombre"}
                          </span>
                        </div>
                        <span className="shrink-0 text-slate-500 dark:text-slate-400 ml-2">
                          {emp.completedOrders} {emp.completedOrders === 1 ? "orden" : "órdenes"} · {formatCurrency(emp.totalRevenue)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-500 dark:bg-blue-400"
                          style={{ width: `${(emp.completedOrders / maxOrders) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Commission KPIs */}
      {commissionStats && commissionStats.commissionRate > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatsCard
            title="Comisiones Pendientes"
            value={formatCurrency(commissionStats.totalPending)}
            icon={Wallet}
            description={`${commissionStats.pendingCount} lavador(es) por cobrar`}
          />
          <StatsCard
            title="Comisiones Pagadas"
            value={formatCurrency(commissionStats.totalPaid)}
            icon={BadgeDollarSign}
            description={`Tasa de comisión: ${commissionStats.commissionRate}%`}
          />
        </div>
      )}

      {/* Recent orders */}
      <div data-onboarding="dashboard-recent-orders">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Órdenes Recientes</h3>
          <Link
            href="/orders"
            className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
          >
            Ver todas →
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead># Orden</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Vehículo</TableHead>
              <TableHead className="hidden md:table-cell">Servicio</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-slate-400">
                  No hay órdenes recientes
                </TableCell>
              </TableRow>
            ) : (
              recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {order.client.firstName} {order.client.lastName}
                  </TableCell>
                  <TableCell className="hidden text-slate-500 md:table-cell">
                    {order.vehicle.plate} · {order.vehicle.brand} {order.vehicle.model}
                  </TableCell>
                  <TableCell className="hidden text-slate-500 md:table-cell">
                    {order.items.map((item) => item.serviceType.name).join(", ")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={ORDER_STATUS_COLORS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-xs text-slate-400 md:table-cell">
                    {formatDate(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
