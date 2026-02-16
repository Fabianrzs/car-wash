"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, ClipboardList, Clock, Users } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
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
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";

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
  client: {
    firstName: string;
    lastName: string;
  };
  vehicle: {
    plate: string;
    brand: string;
    model: string;
  };
  items: {
    serviceType: {
      name: string;
    };
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dailyRes, ordersRes] = await Promise.all([
          fetch("/api/reports?period=daily"),
          fetch("/api/orders?page=1&status="),
        ]);

        if (dailyRes.ok) {
          const data = await dailyRes.json();
          setStats(data);
        }

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setRecentOrders((data.orders || data).slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
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
      <PageHeader
        title="Panel de Control"
        description="Resumen general del negocio"
      />

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Ingresos Hoy"
          value={formatCurrency(stats?.totalIncome || 0)}
          icon={DollarSign}
          description="Total facturado del dia"
        />
        <StatsCard
          title="Ordenes Hoy"
          value={stats?.orderCount || 0}
          icon={ClipboardList}
          description="Ordenes registradas hoy"
        />
        <StatsCard
          title="En Proceso"
          value={stats?.inProgressOrders || 0}
          icon={Clock}
          description="Ordenes en curso"
        />
        <StatsCard
          title="Clientes Atendidos"
          value={stats?.uniqueClients || 0}
          icon={Users}
          description="Clientes unicos del dia"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Ordenes Recientes
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#Orden</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vehiculo</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  No hay ordenes recientes
                </TableCell>
              </TableRow>
            ) : (
              recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {order.client.firstName} {order.client.lastName}
                  </TableCell>
                  <TableCell>
                    {order.vehicle.plate} - {order.vehicle.brand}{" "}
                    {order.vehicle.model}
                  </TableCell>
                  <TableCell>
                    {order.items
                      .map((item) => item.serviceType.name)
                      .join(", ")}
                  </TableCell>
                  <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge className={ORDER_STATUS_COLORS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
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
