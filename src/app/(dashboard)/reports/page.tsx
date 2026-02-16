"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import StatsCard from "@/components/dashboard/StatsCard";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { DollarSign, ClipboardList, TrendingUp, CheckCircle, Download, Calendar, Search } from "lucide-react";

const PERIODS = [
  { label: "Hoy", value: "daily" },
  { label: "Esta Semana", value: "weekly" },
  { label: "Este Mes", value: "monthly" },
  { label: "Rango Personalizado", value: "custom" },
];

interface ReportData {
  totalIncome: number;
  orderCount: number;
  averageOrderValue: number;
  completedOrders: number;
  topServices: Array<{ name: string; totalQuantity: number; totalRevenue: number; orderCount: number }>;
  dailyBreakdown: Array<{ date: string; income: number; orders: number }>;
}

interface OrderItem {
  serviceName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderDetail {
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  client: { firstName: string; lastName: string; phone: string };
  vehicle: { plate: string; brand: string; model: string };
  items: OrderItem[];
  createdBy: { name: string };
}

interface OrdersReport {
  orders: OrderDetail[];
  summary: { totalIncome: number; orderCount: number; completedOrders: number; averageOrderValue: number };
}

function formatDateShort(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("es-CO", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ReportsPage() {
  const [tab, setTab] = useState<"resumen" | "detalle">("resumen");
  const [period, setPeriod] = useState("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [ordersData, setOrdersData] = useState<OrdersReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const buildParams = () => {
    const params = new URLSearchParams({ period });
    if (period === "custom" && startDate && endDate) {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    }
    return params;
  };

  const fetchReport = async () => {
    setLoading(true);
    const params = buildParams();
    const res = await fetch(`/api/reports?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const params = buildParams();
    if (statusFilter) params.set("status", statusFilter);
    if (searchQuery) params.set("search", searchQuery);
    const res = await fetch(`/api/reports/orders?${params}`);
    if (res.ok) setOrdersData(await res.json());
    setLoadingOrders(false);
  };

  useEffect(() => {
    if (period !== "custom") {
      fetchReport();
      if (tab === "detalle") fetchOrders();
    }
  }, [period]);

  useEffect(() => {
    if (tab === "detalle" && !ordersData && period !== "custom") {
      fetchOrders();
    }
  }, [tab]);

  const handleCustomSearch = () => {
    if (startDate && endDate) {
      fetchReport();
      if (tab === "detalle") fetchOrders();
    }
  };

  const handleOrderFilters = () => {
    fetchOrders();
  };

  // Flatten orders for Excel-style view: one row per item
  const flatRows = ordersData?.orders.flatMap((order) =>
    order.items.map((item) => ({ ...order, item }))
  ) || [];

  const exportSummaryCSV = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push("Reporte de Car Wash");
    lines.push(`Periodo: ${period === "custom" ? `${startDate} a ${endDate}` : PERIODS.find(p => p.value === period)?.label}`);
    lines.push("");
    lines.push("Resumen");
    lines.push(`Ingresos Totales,${data.totalIncome}`);
    lines.push(`Total Ordenes,${data.orderCount}`);
    lines.push(`Ticket Promedio,${data.averageOrderValue}`);
    lines.push(`Ordenes Completadas,${data.completedOrders}`);
    lines.push("");
    if (data.topServices.length > 0) {
      lines.push("Servicios Mas Vendidos");
      lines.push("Servicio,Cantidad,Ingresos");
      data.topServices.forEach((s) => lines.push(`${s.name},${s.totalQuantity},${s.totalRevenue}`));
      lines.push("");
    }
    if (data.dailyBreakdown.length > 0) {
      lines.push("Desglose Diario");
      lines.push("Fecha,Ordenes,Ingresos");
      data.dailyBreakdown.forEach((d) => lines.push(`${d.date},${d.orders},${d.income}`));
    }
    downloadCSV(lines.join("\n"), `reporte-resumen-${period}.csv`);
  };

  const exportDetailCSV = () => {
    if (!flatRows.length) return;
    const lines: string[] = [];
    lines.push("# Orden,Estado,Cliente,Telefono,Placa,Marca/Modelo,Servicio,Cantidad,Precio Unit.,Subtotal,Total Orden,Creado Por,Fecha Creacion,Fecha Inicio,Fecha Completado");
    flatRows.forEach((r) => {
      lines.push([
        r.orderNumber,
        ORDER_STATUS_LABELS[r.status] || r.status,
        `${r.client.firstName} ${r.client.lastName}`,
        r.client.phone,
        r.vehicle.plate,
        `${r.vehicle.brand} ${r.vehicle.model}`,
        r.item.serviceName,
        r.item.quantity,
        r.item.unitPrice,
        r.item.subtotal,
        r.totalAmount,
        r.createdBy.name,
        formatDateShort(r.createdAt),
        formatDateShort(r.startedAt),
        formatDateShort(r.completedAt),
      ].map((v) => `"${v}"`).join(","));
    });
    downloadCSV(lines.join("\n"), `reporte-detalle-ordenes-${period}.csv`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <PageHeader title="Reportes" description="Resumen de ingresos y detalle de ordenes">
        {tab === "resumen" && data && (
          <Button variant="secondary" onClick={exportSummaryCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        )}
        {tab === "detalle" && ordersData && (
          <Button variant="secondary" onClick={exportDetailCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Detalle CSV
          </Button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab("resumen")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "resumen" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setTab("detalle")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "detalle" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Detalle de Ordenes
        </button>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              period === p.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <Button onClick={handleCustomSearch} disabled={!startDate || !endDate}>
              <Calendar className="mr-2 h-4 w-4" />
              Generar Reporte
            </Button>
          </div>
        </Card>
      )}

      {/* Tab: Resumen */}
      {tab === "resumen" && (
        <>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : data ? (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Ingresos Totales" value={formatCurrency(data.totalIncome)} icon={DollarSign} />
                <StatsCard title="Total Ordenes" value={String(data.orderCount)} icon={ClipboardList} />
                <StatsCard title="Ticket Promedio" value={formatCurrency(data.averageOrderValue)} icon={TrendingUp} />
                <StatsCard title="Completadas" value={String(data.completedOrders)} icon={CheckCircle} />
              </div>

              {data.topServices && data.topServices.length > 0 && (
                <Card>
                  <h3 className="mb-4 text-lg font-semibold">Servicios Mas Vendidos</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topServices.map((s, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>{s.totalQuantity}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(s.totalRevenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}

              {data.dailyBreakdown && data.dailyBreakdown.length > 0 && (
                <Card className="mt-6">
                  <h3 className="mb-4 text-lg font-semibold">Desglose Diario</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Ordenes</TableHead>
                        <TableHead>Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.dailyBreakdown.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell>{d.date}</TableCell>
                          <TableCell>{d.orders}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(d.income)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500">
              {period === "custom" ? "Selecciona un rango de fechas y presiona \"Generar Reporte\"" : "No hay datos disponibles"}
            </p>
          )}
        </>
      )}

      {/* Tab: Detalle de Ordenes */}
      {tab === "detalle" && (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente, placa, orden..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <Button variant="secondary" onClick={handleOrderFilters}>
              Filtrar
            </Button>
          </div>

          {/* Summary bar */}
          {ordersData && (
            <div className="mb-4 flex flex-wrap gap-6 rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <span><strong>{ordersData.summary.orderCount}</strong> ordenes</span>
              <span><strong>{ordersData.summary.completedOrders}</strong> completadas</span>
              <span>Ingresos: <strong>{formatCurrency(ordersData.summary.totalIncome)}</strong></span>
              <span>Ticket prom.: <strong>{formatCurrency(ordersData.summary.averageOrderValue)}</strong></span>
            </div>
          )}

          {loadingOrders ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : flatRows.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-300">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-200 text-left text-gray-700">
                    <th className="border border-gray-300 px-2 py-2 font-semibold"># Orden</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold">Estado</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold">Cliente</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold">Telefono</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold">Placa</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold">Marca/Modelo</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold">Servicio</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold text-right">Cant.</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold text-right">P. Unit.</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold text-right">Subtotal</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold text-right">Total</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold">Creado Por</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold">Creacion</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold">Inicio</th>
                    <th className="border border-gray-300 px-2 py-2 font-semibold">Completado</th>
                  </tr>
                </thead>
                <tbody>
                  {flatRows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-2 py-1.5 font-mono">{r.orderNumber}</td>
                      <td className="border border-gray-300 px-2 py-1.5">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          r.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                          r.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                          r.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {ORDER_STATUS_LABELS[r.status] || r.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5">{r.client.firstName} {r.client.lastName}</td>
                      <td className="border border-gray-300 px-2 py-1.5">{r.client.phone}</td>
                      <td className="border border-gray-300 px-2 py-1.5 font-mono">{r.vehicle.plate}</td>
                      <td className="border border-gray-300 px-2 py-1.5">{r.vehicle.brand} {r.vehicle.model}</td>
                      <td className="border border-gray-300 px-2 py-1.5">{r.item.serviceName}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right">{r.item.quantity}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right">{formatCurrency(r.item.unitPrice)}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right">{formatCurrency(r.item.subtotal)}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold">{formatCurrency(r.totalAmount)}</td>
                      <td className="border border-gray-300 px-2 py-1.5">{r.createdBy.name}</td>
                      <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{formatDateShort(r.createdAt)}</td>
                      <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{formatDateShort(r.startedAt)}</td>
                      <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{formatDateShort(r.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              {period === "custom" && (!startDate || !endDate)
                ? "Selecciona un rango de fechas y presiona \"Generar Reporte\""
                : "No hay ordenes en este periodo"}
            </p>
          )}
        </>
      )}
    </div>
  );
}
