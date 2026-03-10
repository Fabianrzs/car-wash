"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import { Plus, Eye } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";

const STATUS_TABS = [
  { label: "Todas", value: "" },
  { label: "Pendientes", value: "PENDING" },
  { label: "En Proceso", value: "IN_PROGRESS" },
  { label: "Completadas", value: "COMPLETED" },
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
    if (v === "mine") {
      url.searchParams.set("view", "mine");
    } else {
      url.searchParams.delete("view");
    }
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
        const data = await fetchApi<{ orders: Order[]; pages: number }>(`/api/orders?${params}`);
        if (!cancelled) {
          setOrders(data.orders || []);
          setTotalPages(data.pages || 1);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar ordenes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [page, debouncedSearch, status, view]);

  const badgeVariant = (s: string) =>
    s === "COMPLETED" ? "success" : s === "IN_PROGRESS" ? "info" : s === "CANCELLED" ? "danger" : "warning";

  return (
    <div>
      <PageHeader title="Ordenes de Servicio" description="Gestion de ordenes de lavado">
        <Button onClick={() => router.push("/orders/new")}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Orden
        </Button>
      </PageHeader>

      {error && <Alert variant="error" className="mt-4">{error}</Alert>}

      <div className="mt-6">
        {/* View tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
          {[{ label: "Todas", value: "all" as const }, { label: "Mis órdenes", value: "mine" as const }].map((t) => (
            <button
              key={t.value}
              onClick={() => setViewWithUrl(t.value)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                view === t.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors md:px-4 md:py-2 ${
                status === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-4 w-full md:max-w-sm">
          <Input
            placeholder="Buscar por numero de orden..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead># Orden</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Vehiculo</TableHead>
                  <TableHead className="hidden md:table-cell">Servicios</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Asignado a</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">No se encontraron ordenes</TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.orderNumber}</TableCell>
                      <TableCell>{o.client.firstName} {o.client.lastName}</TableCell>
                      <TableCell className="hidden md:table-cell">{o.vehicle.plate}</TableCell>
                      <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                        {o.items.map((i) => i.serviceType.name).join(", ")}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(o.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(o.status)}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                        {o.assignedTo?.name ?? <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{formatDate(o.createdAt)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/orders/${o.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
