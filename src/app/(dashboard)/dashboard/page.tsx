"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DollarSign, ClipboardList, Clock, Users } from "lucide-react";
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

interface ReportStats {
  totalIncome: number;
  orderCount: number;
  inProgressOrders: number;
  uniqueClients: number;
  completedOrders: number;
  averageOrderValue: number;
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

export default function DashboardPage() {
  const router = useRouter();
  const role = useTenantRole();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role === "EMPLOYEE") router.replace("/mis-ordenes");
  }, [role, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dailyData, ordersData] = await Promise.all([
          fetchApi<ReportStats>("/api/reports?period=daily").catch(() => null),
          fetchApi<{ orders: Order[] }>("/api/orders?page=1&status=").catch(() => null),
        ]);
        if (dailyData) setStats(dailyData);
        else setError("No se pudieron cargar las estadísticas del día.");
        if (ordersData) setRecentOrders((ordersData.orders || []).slice(0, 10));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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

      <div data-onboarding="dashboard-stats" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Ingresos Hoy"
          value={formatCurrency(stats?.totalIncome || 0)}
          icon={DollarSign}
          description="Total facturado del día"
        />
        <StatsCard
          title="Órdenes Hoy"
          value={stats?.orderCount || 0}
          icon={ClipboardList}
          description="Órdenes registradas hoy"
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
