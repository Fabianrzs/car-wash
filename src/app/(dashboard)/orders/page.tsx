"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils/constants";
import { fetchApi } from "@/lib/utils/api";
import { Plus, Search, Eye, LayoutGrid, List, Play, CheckCircle, Clock, User, RefreshCw } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

const STATUS_TABS = [
  { label: "Todas",       value: "" },
  { label: "Pendientes",  value: "PENDING" },
  { label: "En Proceso",  value: "IN_PROGRESS" },
  { label: "Completadas", value: "COMPLETED" },
  { label: "Canceladas",  value: "CANCELLED" },
];

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

const BOARD_COLUMNS = [
  { status: "PENDING",     label: "Pendientes",  color: "bg-amber-400",   header: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-300" },
  { status: "IN_PROGRESS", label: "En Proceso",  color: "bg-blue-400",    header: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700/40 dark:text-blue-300" },
  { status: "COMPLETED",   label: "Completadas", color: "bg-emerald-400", header: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700/40 dark:text-emerald-300" },
];

function BoardCard({
  order,
  onStatusChange,
  onView,
  updating,
}: {
  order: Order;
  onStatusChange: (id: string, status: string) => void;
  onView: (id: string) => void;
  updating: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{order.orderNumber}</span>
        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(order.totalAmount)}</span>
      </div>
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <User className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate font-medium">{order.client.firstName} {order.client.lastName}</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono font-medium">{order.vehicle.plate}</span>
          {" · "}{order.vehicle.brand} {order.vehicle.model}
        </div>
        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
          {order.items.map((i) => i.serviceType.name).join(", ")}
        </div>
        {order.assignedTo && (
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <User className="h-3 w-3" />
            {order.assignedTo.name ?? "—"}
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        {order.status === "PENDING" && (
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onStatusChange(order.id, "IN_PROGRESS")}
            loading={updating === order.id}
          >
            <Play className="h-3 w-3" /> Iniciar
          </Button>
        )}
        {order.status === "IN_PROGRESS" && (
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 text-xs hover:bg-emerald-700"
            onClick={() => onStatusChange(order.id, "COMPLETED")}
            loading={updating === order.id}
          >
            <CheckCircle className="h-3 w-3" /> Completar
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onView(order.id)} title="Ver detalle">
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState<"all" | "mine">(
    searchParams.get("view") === "mine" ? "mine" : "all"
  );
  const [displayMode, setDisplayMode] = useState<"table" | "board">(
    searchParams.get("mode") === "board" ? "board" : "table"
  );

  // Board-specific state
  const [boardOrders, setBoardOrders] = useState<Record<string, Order[]>>({});
  const [boardLoading, setBoardLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [boardSearch, setBoardSearch] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const setViewWithUrl = (v: "all" | "mine") => {
    setView(v);
    setPage(1);
    const url = new URL(window.location.href);
    if (v === "mine") url.searchParams.set("view", "mine");
    else url.searchParams.delete("view");
    router.replace(url.pathname + url.search);
  };

  const setDisplayModeWithUrl = (m: "table" | "board") => {
    setDisplayMode(m);
    const url = new URL(window.location.href);
    if (m === "board") url.searchParams.set("mode", "board");
    else url.searchParams.delete("mode");
    router.replace(url.pathname + url.search);
  };

  // Table fetch
  useEffect(() => {
    if (displayMode !== "table") return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (status) params.set("status", status);
        if (view === "mine") params.set("assignedToMe", "true");
        const data = await fetchApi<{ orders: Order[]; pages: number }>(`/api/orders?${params}`);
        if (!cancelled) {
          setOrders(data.orders || []);
          setTotalPages(data.pages || 1);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar órdenes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [page, debouncedSearch, status, view, displayMode]);

  // Board fetch
  const fetchBoard = useCallback(async (silent = false) => {
    if (!silent) setBoardLoading(true);
    try {
      const base = view === "mine" ? "&assignedToMe=true" : "";
      const [pending, inProgress, completed] = await Promise.all([
        fetchApi<{ orders: Order[] }>(`/api/orders?board=true&status=PENDING${base}`),
        fetchApi<{ orders: Order[] }>(`/api/orders?board=true&status=IN_PROGRESS${base}`),
        fetchApi<{ orders: Order[] }>(`/api/orders?board=true&status=COMPLETED${base}`),
      ]);
      setBoardOrders({
        PENDING: pending.orders ?? [],
        IN_PROGRESS: inProgress.orders ?? [],
        COMPLETED: completed.orders ?? [],
      });
      setLastRefreshed(new Date());
      setSecondsAgo(0);
    } finally {
      if (!silent) setBoardLoading(false);
    }
  }, [view]);

  // Auto-refresh board every 30 s
  useEffect(() => {
    if (displayMode !== "board") {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
      return;
    }
    fetchBoard();
    autoRefreshRef.current = setInterval(() => fetchBoard(true), 30_000);
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [displayMode, fetchBoard]);

  // Seconds-ago counter
  useEffect(() => {
    if (!lastRefreshed) return;
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefreshed.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastRefreshed]);

  const handleBoardStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await fetchBoard();
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBoardOrders = (status: string): Order[] => {
    const list = boardOrders[status] ?? [];
    if (!boardSearch.trim()) return list;
    const q = boardSearch.trim().toLowerCase();
    return list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.vehicle.plate.toLowerCase().includes(q) ||
        `${o.client.firstName} ${o.client.lastName}`.toLowerCase().includes(q)
    );
  };

  return (
    <div>
      <OnboardingTour flowKey="orders" />
      <PageHeader title="Órdenes de Servicio" description="Gestión de órdenes de lavado">
        <div className="flex items-center gap-2">
          {/* Display mode toggle */}
          <div className="flex gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800/60">
            <button
              onClick={() => setDisplayModeWithUrl("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                displayMode === "table"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <List className="h-3.5 w-3.5" /> Lista
            </button>
            <button
              onClick={() => setDisplayModeWithUrl("board")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                displayMode === "board"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Tablero
            </button>
          </div>
          <span data-onboarding="orders-new-btn">
            <Button onClick={() => router.push("/orders/new")}>
              <Plus className="h-4 w-4" />
              Nueva Orden
            </Button>
          </span>
        </div>
      </PageHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {/* View toggle (all / mine) — shared */}
      <div className="mb-4 flex w-fit gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800/60">
        {(["all", "mine"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setViewWithUrl(v)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              view === v
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {v === "all" ? "Todas" : "Mis órdenes"}
          </button>
        ))}
      </div>

      {/* ─── TABLE MODE ─── */}
      {displayMode === "table" && (
        <>
          <div data-onboarding="orders-status-tabs" className="mb-4 flex flex-wrap items-center gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatus(tab.value); setPage(1); }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  status === tab.value
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div data-onboarding="orders-search" className="mb-4 relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por número, placa o cliente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <>
              <div data-onboarding="orders-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead># Orden</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">Vehículo</TableHead>
                      <TableHead className="hidden md:table-cell">Servicios</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden lg:table-cell">Asignado a</TableHead>
                      <TableHead className="hidden md:table-cell">Fecha</TableHead>
                      <TableHead className="w-12"> </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-12 text-center text-slate-400">
                          No se encontraron órdenes
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{o.orderNumber}</TableCell>
                          <TableCell className="font-medium text-slate-900">{o.client.firstName} {o.client.lastName}</TableCell>
                          <TableCell className="hidden text-slate-500 md:table-cell">{o.vehicle.plate}</TableCell>
                          <TableCell className="hidden max-w-[180px] truncate text-slate-500 md:table-cell">
                            {o.items.map((i) => i.serviceType.name).join(", ")}
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(o.totalAmount)}</TableCell>
                          <TableCell>
                            <Badge className={ORDER_STATUS_COLORS[o.status]}>
                              {ORDER_STATUS_LABELS[o.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-slate-500 lg:table-cell">
                            {o.assignedTo?.name ?? <span className="text-slate-300">—</span>}
                          </TableCell>
                          <TableCell className="hidden text-xs text-slate-400 md:table-cell">{formatDate(o.createdAt)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => router.push(`/orders/${o.id}`)} title="Ver detalle">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      {/* ─── BOARD MODE ─── */}
      {displayMode === "board" && (
        <>
          {/* Board toolbar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Filtrar por placa o cliente..."
                value={boardSearch}
                onChange={(e) => setBoardSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              {lastRefreshed && (
                <span>Actualizado hace {secondsAgo}s</span>
              )}
              <button
                onClick={() => fetchBoard()}
                disabled={boardLoading}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", boardLoading && "animate-spin")} />
                Actualizar
              </button>
            </div>
          </div>

          {boardLoading && Object.keys(boardOrders).length === 0 ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {BOARD_COLUMNS.map((col) => {
                const colOrders = filteredBoardOrders(col.status);
                return (
                  <div key={col.status}>
                    {/* Column header */}
                    <div className={cn("mb-3 flex items-center gap-2 rounded-lg border px-3 py-2", col.header)}>
                      <div className={cn("h-2 w-2 rounded-full", col.color)} />
                      <span className="text-sm font-semibold">{col.label}</span>
                      <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium dark:bg-black/20">
                        {colOrders.length}
                      </span>
                      {col.status === "COMPLETED" && (
                        <span className="flex items-center gap-1 text-[10px] opacity-70">
                          <Clock className="h-3 w-3" /> hoy
                        </span>
                      )}
                    </div>

                    {/* Cards */}
                    <div className="space-y-3">
                      {colOrders.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-600">
                          Sin órdenes
                        </div>
                      ) : (
                        colOrders.map((order) => (
                          <BoardCard
                            key={order.id}
                            order={order}
                            onStatusChange={handleBoardStatusChange}
                            onView={(id) => router.push(`/orders/${id}`)}
                            updating={updatingId}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
