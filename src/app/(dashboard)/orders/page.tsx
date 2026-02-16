"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react";

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
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const data = await fetchApi<{ orders: Order[]; pages: number }>(`/api/orders?${params}`);
      setOrders(data.orders || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar ordenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, search, status]);

  const badgeVariant = (s: string) =>
    s === "COMPLETED" ? "success" : s === "IN_PROGRESS" ? "info" : s === "CANCELLED" ? "danger" : "warning";

  return (
    <div className="p-6">
      <PageHeader title="Ordenes de Servicio" description="Gestion de ordenes de lavado">
        <Button onClick={() => router.push("/orders/new")}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Orden
        </Button>
      </PageHeader>

      {error && <Alert variant="error" className="mt-4">{error}</Alert>}

      <div className="mt-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                status === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-4 max-w-sm">
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
                  <TableHead>Vehiculo</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500">No se encontraron ordenes</TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.orderNumber}</TableCell>
                      <TableCell>{o.client.firstName} {o.client.lastName}</TableCell>
                      <TableCell>{o.vehicle.plate}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {o.items.map((i) => i.serviceType.name).join(", ")}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(o.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(o.status)}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(o.createdAt)}</TableCell>
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

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">Pagina {page} de {totalPages}</span>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
