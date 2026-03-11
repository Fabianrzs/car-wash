"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
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
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

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
  { label: "Pendientes",  value: "PENDING" },
  { label: "En Progreso", value: "IN_PROGRESS" },
  { label: "Completadas", value: "COMPLETED" },
];

const badgeVariant = (s: string) =>
  s === "COMPLETED"   ? "success"
  : s === "IN_PROGRESS" ? "info"
  : s === "CANCELLED"   ? "danger"
  : "warning";

export default function MisOrdenesPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [mainTab, setMainTab]     = useState<"mine" | "unassigned">("mine");
  const [statusTab, setStatusTab] = useState("PENDING");
  const [myOrders, setMyOrders]               = useState<Order[]>([]);
  const [unassignedOrders, setUnassignedOrders] = useState<Order[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loadingMine, setLoadingMine]           = useState(true);
  const [loadingUnassigned, setLoadingUnassigned] = useState(true);
  const [statsLoading, setStatsLoading]         = useState(true);
  const [error, setError]         = useState("");
  const [updating, setUpdating]   = useState<string | null>(null);

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
    { label: "Asignadas hoy", value: stats?.today ?? 0, icon: CalendarDays, color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800" },
    { label: "En progreso",   value: stats?.byStatus.IN_PROGRESS ?? 0, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Completadas",   value: stats?.totalCompleted ?? 0, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Ingresos",      value: formatCurrency(stats?.totalRevenue ?? 0), icon: DollarSign, color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800", isText: true },
  ];

  return (
    <div>
      <OnboardingTour flowKey="mis-ordenes" />
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Mis Órdenes</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gestiona tus órdenes asignadas y toma nuevas del pool</p>
      </div>

      {/* Stats */}
      <div data-onboarding="mis-ordenes-stats" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", card.bg)}>
              <card.icon className={cn("h-5 w-5", card.color)} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
              {statsLoading ? (
                <div className="mt-1 h-5 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className={cn("text-lg font-semibold", card.color)}>{card.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {/* Main tabs */}
      <div data-onboarding="mis-ordenes-main-tabs" className="mb-5 flex w-fit gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800/60">
        <button
          onClick={() => setMainTab("mine")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            mainTab === "mine" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          Mis Órdenes
          {stats && (
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[11px] font-medium",
              mainTab === "mine" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            )}>
              {(stats.byStatus.PENDING) + (stats.byStatus.IN_PROGRESS)}
            </span>
          )}
        </button>
        <button
          onClick={() => setMainTab("unassigned")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            mainTab === "unassigned" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          Sin Asignar
          {!loadingUnassigned && (
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[11px] font-medium",
              mainTab === "unassigned" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            )}>
              {unassignedOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* MIS ÓRDENES panel */}
      {mainTab === "mine" && (
        <>
          {/* Status sub-tabs */}
          <div data-onboarding="mis-ordenes-status-tabs" className="mb-4 flex gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusTab(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  statusTab === tab.value
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                )}
              >
                {tab.label}
                {stats && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    statusTab === tab.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  )}>
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
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : myOrders.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={
                statusTab === "PENDING"     ? "Sin órdenes pendientes"
                : statusTab === "IN_PROGRESS" ? "Sin órdenes en progreso"
                : "Sin órdenes completadas"
              }
              action={
                statusTab === "PENDING" ? (
                  <button
                    onClick={() => setMainTab("unassigned")}
                    className="text-sm text-slate-600 underline-offset-2 hover:underline dark:text-slate-400"
                  >
                    Ver órdenes sin asignar →
                  </button>
                ) : undefined
              }
            />
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

      {/* SIN ASIGNAR panel */}
      {mainTab === "unassigned" && (
        <>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Órdenes pendientes sin lavador asignado. Haz clic en{" "}
            <strong className="text-slate-700 dark:text-slate-300">Tomar</strong> para asignarte una.
          </p>
          {loadingUnassigned ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : unassignedOrders.length === 0 ? (
            <EmptyState icon={UserCheck} title="No hay órdenes sin asignar" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unassignedOrders.map((order) => (
                <UnassignedCard
                  key={order.id}
                  order={order}
                  updating={updating}
                  onTake={takeOrder}
                  onView={() => router.push(`/orders/${order.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Icon className="h-7 w-7 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</p>
      {action && <div className="mt-2">{action}</div>}
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{order.orderNumber}</span>
        <Badge variant={badgeVariant(order.status)}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>
      <div className="mb-4 space-y-2">
        <Field label="Cliente" value={`${order.client.firstName} ${order.client.lastName}`} />
        <Field label="Vehículo" value={`${order.vehicle.plate} · ${order.vehicle.brand} ${order.vehicle.model}`} />
        <Field label="Servicios" value={order.items.map((i) => i.serviceType.name).join(", ")} truncate />
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(order.createdAt)}</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(order.totalAmount)}</span>
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
            <Play className="h-3.5 w-3.5" /> Iniciar
          </Button>
        )}
        {order.status === "IN_PROGRESS" && (
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onUpdateStatus(order.id, "COMPLETED")}
            loading={updating === order.id}
          >
            <CheckCircle className="h-3.5 w-3.5" /> Completar
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onView} title="Ver detalle">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function UnassignedCard({
  order,
  updating,
  onTake,
  onView,
}: {
  order: Order;
  updating: string | null;
  onTake: (id: string) => void;
  onView: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-white p-5 dark:border-amber-800/50 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{order.orderNumber}</span>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-500/25">
          Sin asignar
        </span>
      </div>
      <div className="mb-4 space-y-2">
        <Field label="Cliente" value={`${order.client.firstName} ${order.client.lastName}`} />
        <Field label="Vehículo" value={`${order.vehicle.plate} · ${order.vehicle.brand} ${order.vehicle.model}`} />
        <Field label="Servicios" value={order.items.map((i) => i.serviceType.name).join(", ")} truncate />
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(order.createdAt)}</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onTake(order.id)}
          loading={updating === order.id}
        >
          <UserCheck className="h-3.5 w-3.5" /> Tomar orden
        </Button>
        <Button size="sm" variant="ghost" onClick={onView} title="Ver detalle">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className={cn("text-sm text-slate-700 dark:text-slate-300", truncate && "truncate")}>{value}</p>
    </div>
  );
}
