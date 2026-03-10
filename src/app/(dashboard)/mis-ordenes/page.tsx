"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import { Play, CheckCircle, ExternalLink, ClipboardList, Clock, DollarSign, CalendarDays } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  client: { firstName: string; lastName: string };
  vehicle: { plate: string; brand: string; model: string };
  items: Array<{ serviceType: { name: string } }>;
  assignedTo: { id: string; name: string | null } | null;
}

interface Stats {
  today: number;
  byStatus: { PENDING: number; IN_PROGRESS: number; COMPLETED: number };
  totalCompleted: number;
  totalRevenue: number;
}

const STATUS_TABS = [
  { label: "Pendientes", value: "PENDING" },
  { label: "En Progreso", value: "IN_PROGRESS" },
  { label: "Completadas", value: "COMPLETED" },
];

export default function MisOrdenesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<Stats>("/api/orders/my-stats")
      .then(setStats)
      .catch(() => null)
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ assignedToMe: "true", status: activeTab, page: "1" });
      const data = await fetchApi<{ orders: Order[] }>(`/api/orders?${params}`);
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar ordenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        // Refresh stats
        fetchApi<Stats>("/api/orders/my-stats").then(setStats).catch(() => null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al actualizar estado");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setUpdating(null);
    }
  };

  const badgeVariant = (s: string) =>
    s === "COMPLETED" ? "success" : s === "IN_PROGRESS" ? "info" : s === "CANCELLED" ? "danger" : "warning";

  const statCards = [
    {
      label: "Asignadas hoy",
      value: stats?.today ?? 0,
      icon: CalendarDays,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "En progreso",
      value: stats?.byStatus.IN_PROGRESS ?? 0,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Completadas",
      value: stats?.totalCompleted ?? 0,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Ingresos generados",
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-50",
      isText: true,
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Mis Órdenes" description="Resumen y gestión de tus órdenes asignadas" />

      {/* Stats grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="flex items-center gap-4 p-5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              {statsLoading ? (
                <div className="mt-1 h-6 w-10 animate-pulse rounded bg-gray-200" />
              ) : (
                <p className={`text-xl font-bold ${card.color}`}>
                  {card.isText ? card.value : card.value}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Status summary chips */}
      {stats && !statsLoading && (
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1 text-sm">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            <span className="text-yellow-700 font-medium">{stats.byStatus.PENDING}</span>
            <span className="text-yellow-600">pendientes</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-blue-700 font-medium">{stats.byStatus.IN_PROGRESS}</span>
            <span className="text-blue-600">en progreso</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-green-700 font-medium">{stats.byStatus.COMPLETED}</span>
            <span className="text-green-600">completadas (total)</span>
          </div>
        </div>
      )}

      {error && <Alert variant="error" className="mt-4">{error}</Alert>}

      <div className="mt-6">
        {/* Status tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {stats && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab.value ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
                }`}>
                  {tab.value === "PENDING" ? stats.byStatus.PENDING :
                   tab.value === "IN_PROGRESS" ? stats.byStatus.IN_PROGRESS :
                   stats.byStatus.COMPLETED}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ClipboardList className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700">No tienes órdenes asignadas</p>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === "PENDING"
                ? "No hay órdenes pendientes asignadas a ti"
                : activeTab === "IN_PROGRESS"
                ? "No tienes órdenes en progreso"
                : "No hay órdenes completadas registradas"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-blue-600">#{order.orderNumber}</span>
                  <Badge variant={badgeVariant(order.status)}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Cliente</p>
                    <p className="font-medium text-sm">{order.client.firstName} {order.client.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vehículo</p>
                    <p className="text-sm text-gray-700">{order.vehicle.plate} — {order.vehicle.brand} {order.vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Servicios</p>
                    <p className="text-sm text-gray-700 truncate">{order.items.map((i) => i.serviceType.name).join(", ")}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === "PENDING" && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateStatus(order.id, "IN_PROGRESS")}
                      loading={updating === order.id}
                    >
                      <Play className="mr-1 h-3.5 w-3.5" /> Iniciar
                    </Button>
                  )}
                  {order.status === "IN_PROGRESS" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => updateStatus(order.id, "COMPLETED")}
                      loading={updating === order.id}
                    >
                      <CheckCircle className="mr-1 h-3.5 w-3.5" /> Completar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/orders/${order.id}`)}
                    title="Ver detalle"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
