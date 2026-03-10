"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import {
  Play,
  CheckCircle,
  ExternalLink,
  ClipboardList,
  Clock,
  DollarSign,
  CalendarDays,
  UserCheck,
} from "lucide-react";

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

const badgeVariant = (s: string) =>
  s === "COMPLETED" ? "success" : s === "IN_PROGRESS" ? "info" : s === "CANCELLED" ? "danger" : "warning";

export default function MisOrdenesPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [mainTab, setMainTab] = useState<"mine" | "unassigned">("mine");
  const [statusTab, setStatusTab] = useState("PENDING");
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [unassignedOrders, setUnassignedOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingUnassigned, setLoadingUnassigned] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    setStatsLoading(true);
    fetchApi<Stats>("/api/orders/my-stats")
      .then(setStats)
      .catch(() => null)
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchMyOrders = useCallback(async () => {
    setLoadingMine(true);
    setError("");
    try {
      const params = new URLSearchParams({ assignedToMe: "true", status: statusTab, page: "1" });
      const data = await fetchApi<{ orders: Order[] }>(`/api/orders?${params}`);
      setMyOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar órdenes");
    } finally {
      setLoadingMine(false);
    }
  }, [statusTab]);

  const fetchUnassigned = useCallback(async () => {
    setLoadingUnassigned(true);
    try {
      const data = await fetchApi<{ orders: Order[] }>("/api/orders?unassigned=true&page=1");
      setUnassignedOrders(data.orders || []);
    } catch {
      // silently fail
    } finally {
      setLoadingUnassigned(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchMyOrders(); }, [fetchMyOrders]);
  useEffect(() => { fetchUnassigned(); }, [fetchUnassigned]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMyOrders((prev) => prev.filter((o) => o.id !== orderId));
        fetchStats();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al actualizar estado");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setUpdating(null);
    }
  };

  const takeOrder = async (orderId: string) => {
    if (!session?.user?.id) return;
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: session.user.id }),
      });
      if (res.ok) {
        setUnassignedOrders((prev) => prev.filter((o) => o.id !== orderId));
        fetchMyOrders();
        fetchStats();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al tomar la orden");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setUpdating(null);
    }
  };

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Órdenes</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona tus órdenes asignadas y toma nuevas del pool</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
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
                <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {/* Main tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setMainTab("mine")}
          className={`rounded-md px-5 py-2 text-sm font-medium transition-colors ${
            mainTab === "mine" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Mis Órdenes
          {stats && (
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
              mainTab === "mine" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
            }`}>
              {(stats.byStatus.PENDING) + (stats.byStatus.IN_PROGRESS)}
            </span>
          )}
        </button>
        <button
          onClick={() => setMainTab("unassigned")}
          className={`rounded-md px-5 py-2 text-sm font-medium transition-colors ${
            mainTab === "unassigned" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sin Asignar
          {!loadingUnassigned && (
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
              mainTab === "unassigned" ? "bg-orange-100 text-orange-700" : "bg-gray-200 text-gray-500"
            }`}>
              {unassignedOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* MIS ÓRDENES */}
      {mainTab === "mine" && (
        <>
          {/* Status sub-tabs */}
          <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusTab(tab.value)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  statusTab === tab.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {stats && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    statusTab === tab.value ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
                  }`}>
                    {tab.value === "PENDING"
                      ? stats.byStatus.PENDING
                      : tab.value === "IN_PROGRESS"
                      ? stats.byStatus.IN_PROGRESS
                      : stats.byStatus.COMPLETED}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loadingMine ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : myOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-700">
                {statusTab === "PENDING"
                  ? "No tienes órdenes pendientes"
                  : statusTab === "IN_PROGRESS"
                  ? "No tienes órdenes en progreso"
                  : "No hay órdenes completadas"}
              </p>
              {statusTab === "PENDING" && (
                <p className="text-sm text-gray-500 mt-1">
                  Revisa la pestaña{" "}
                  <button
                    onClick={() => setMainTab("unassigned")}
                    className="text-blue-600 hover:underline"
                  >
                    Sin Asignar
                  </button>{" "}
                  para tomar nuevas órdenes
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  updating={updating}
                  onUpdateStatus={updateStatus}
                  onView={() => router.push(`/orders/${order.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* SIN ASIGNAR */}
      {mainTab === "unassigned" && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Órdenes pendientes sin lavador asignado. Haz clic en <strong>Tomar</strong> para asignarte una.
          </p>

          {loadingUnassigned ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : unassignedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <UserCheck className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-700">No hay órdenes sin asignar</p>
              <p className="text-sm text-gray-500 mt-1">Todas las órdenes pendientes tienen lavador asignado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unassignedOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-blue-600">#{order.orderNumber}</span>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      Sin asignar
                    </span>
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
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => takeOrder(order.id)}
                      loading={updating === order.id}
                    >
                      <UserCheck className="mr-1 h-3.5 w-3.5" /> Tomar orden
                    </Button>
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
        </>
      )}
    </div>
  );
}

function OrderCard({
  order,
  updating,
  onUpdateStatus,
  onView,
}: {
  order: Order;
  updating: string | null;
  onUpdateStatus: (id: string, status: string) => void;
  onView: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
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
            onClick={() => onUpdateStatus(order.id, "IN_PROGRESS")}
            loading={updating === order.id}
          >
            <Play className="mr-1 h-3.5 w-3.5" /> Iniciar
          </Button>
        )}
        {order.status === "IN_PROGRESS" && (
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => onUpdateStatus(order.id, "COMPLETED")}
            loading={updating === order.id}
          >
            <CheckCircle className="mr-1 h-3.5 w-3.5" /> Completar
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onView} title="Ver detalle">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
