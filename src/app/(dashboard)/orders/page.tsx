"use client";

import { useEffect, useState } from "react";
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
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import { Plus, Search, Eye } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

const STATUS_TABS = [
  { label: "Todas",      value: "" },
  { label: "Pendientes", value: "PENDING" },
  { label: "En Proceso", value: "IN_PROGRESS" },
  { label: "Completadas",value: "COMPLETED" },
  { label: "Canceladas", value: "CANCELLED" },
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
  const debouncedSearch = useDebounce(search, 300);

  const setViewWithUrl = (v: "all" | "mine") => {
    setView(v);
    setPage(1);
    const url = new URL(window.location.href);
    if (v === "mine") url.searchParams.set("view", "mine");
    else url.searchParams.delete("view");
    router.replace(url.pathname + url.search);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (status) params.set("status", status);
        if (view === "mine") params.set("assignedToMe", "true");
        const data = await fetchApi<{ orders: Order[]; pages: number }>(
          `/api/orders?${params}`
        );
        if (!cancelled) {
          setOrders(data.orders || []);
          setTotalPages(data.pages || 1);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Error al cargar órdenes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [page, debouncedSearch, status, view]);

  return (
    <div>
      <OnboardingTour flowKey="orders" />
      <PageHeader
        title="Órdenes de Servicio"
        description="Gestión de órdenes de lavado"
      >
        <span data-onboarding="orders-new-btn">
          <Button onClick={() => router.push("/orders/new")}>
            <Plus className="h-4 w-4" />
            Nueva Orden
          </Button>
        </span>
      </PageHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {/* View toggle */}
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

      {/* Status filter */}
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

      {/* Search */}
      <div data-onboarding="orders-search" className="mb-4 relative w-full md:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por número..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
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
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-12 text-center text-slate-400"
                  >
                    No se encontraron órdenes
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {o.orderNumber}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {o.client.firstName} {o.client.lastName}
                    </TableCell>
                    <TableCell className="hidden text-slate-500 md:table-cell">
                      {o.vehicle.plate}
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate text-slate-500 md:table-cell">
                      {o.items.map((i) => i.serviceType.name).join(", ")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(o.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={ORDER_STATUS_COLORS[o.status]}>
                        {ORDER_STATUS_LABELS[o.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-slate-500 lg:table-cell">
                      {o.assignedTo?.name ?? (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-xs text-slate-400 md:table-cell">
                      {formatDate(o.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/orders/${o.id}`)}
                        title="Ver detalle"
                      >
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
    </div>
  );
}
