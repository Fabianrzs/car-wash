"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import StatsCard from "@/components/dashboard/StatsCard";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/utils/constants";
import { DollarSign, ClipboardList, TrendingUp, CheckCircle, Download, Calendar, Search } from "lucide-react";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

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
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({ period });
    if (period === "custom" && startDate && endDate) {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    }
    return params;
  }, [period, startDate, endDate]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = buildParams();
      const res = await fetch(`/api/reports?${params}`);
      if (res.ok) setData(await res.json());
      else setError("No se pudieron cargar los datos del reporte");
    } catch {
      setError("Error de conexion al cargar el reporte");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const params = buildParams();
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/reports/orders?${params}`);
      if (res.ok) setOrdersData(await res.json());
    } finally {
      setLoadingOrders(false);
    }
  }, [buildParams, statusFilter, searchQuery]);

  // Fetch on period change (skip custom until user explicitly triggers)
  useEffect(() => {
    if (period !== "custom") {
      fetchReport();
    }
  }, [period, fetchReport]);

  // Fetch orders when switching to detail tab (if not already loaded for this period)
  useEffect(() => {
    if (tab === "detalle" && period !== "custom") {
      fetchOrders();
    }
  }, [tab, period, fetchOrders]);

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
    <div>
      <OnboardingTour flowKey="reports" />
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
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setTab("resumen")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "resumen" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setTab("detalle")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "detalle" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          Detalle de Ordenes
        </button>
      </div>

      {/* Period selector */}
      <div data-onboarding="reports-period-selector" className="mb-6 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors md:px-4 md:py-2 ${
              period === p.value ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <Card className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-zinc-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Fecha Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-zinc-300"
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
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-800 dark:bg-rose-900/20">
              <p className="text-rose-700 dark:text-rose-400">{error}</p>
            </div>
          ) : data ? (
            <>
              <div data-onboarding="reports-stats" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className="text-center text-slate-500 dark:text-slate-400">
              {period === "custom" ? "Selecciona un rango de fechas y presiona \"Generar Reporte\"" : "No hay datos disponibles"}
            </p>
          )}
        </>
      )}

      {/* Tab: Detalle de Ordenes */}
      {tab === "detalle" && (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-zinc-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cliente, placa, orden..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 focus:border-zinc-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <Button variant="secondary" onClick={handleOrderFilters}>
              Filtrar
            </Button>
          </div>

          {/* Summary bar */}
          {ordersData && (
            <div className="mb-4 flex flex-wrap gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700 md:gap-6 dark:bg-slate-800/50 dark:text-slate-300">
              <span><strong>{ordersData.summary.orderCount}</strong> ordenes</span>
              <span><strong>{ordersData.summary.completedOrders}</strong> completadas</span>
              <span>Ingresos: <strong>{formatCurrency(ordersData.summary.totalIncome)}</strong></span>
              <span>Ticket prom.: <strong>{formatCurrency(ordersData.summary.averageOrderValue)}</strong></span>
            </div>
          )}

          {loadingOrders ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : flatRows.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <th className="border border-slate-200 px-2 py-2 font-semibold dark:border-slate-700"># Orden</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold dark:border-slate-700">Estado</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold dark:border-slate-700">Cliente</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold dark:border-slate-700">Telefono</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold dark:border-slate-700">Placa</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold dark:border-slate-700">Marca/Modelo</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold dark:border-slate-700">Servicio</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold text-right dark:border-slate-700">Cant.</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold text-right dark:border-slate-700">P. Unit.</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold text-right dark:border-slate-700">Subtotal</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold text-right dark:border-slate-700">Total</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold dark:border-slate-700">Creado Por</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold dark:border-slate-700">Creacion</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold dark:border-slate-700">Inicio</th>
                    <th className="border border-slate-200 px-2 py-2 font-semibold dark:border-slate-700">Completado</th>
                  </tr>
                </thead>
                <tbody>
                  {flatRows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                      <td className="border border-slate-200 px-2 py-1.5 font-mono text-slate-900 dark:border-slate-700 dark:text-slate-100">{r.orderNumber}</td>
                      <td className="border border-slate-200 px-2 py-1.5 dark:border-slate-700">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          r.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          r.status === "IN_PROGRESS" ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300" :
                          r.status === "CANCELLED" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {ORDER_STATUS_LABELS[r.status] || r.status}
                        </span>
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-slate-700 dark:border-slate-700 dark:text-slate-300">{r.client.firstName} {r.client.lastName}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-slate-700 dark:border-slate-700 dark:text-slate-300">{r.client.phone}</td>
                      <td className="border border-slate-200 px-2 py-1.5 font-mono text-slate-900 dark:border-slate-700 dark:text-slate-100">{r.vehicle.plate}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-slate-700 dark:border-slate-700 dark:text-slate-300">{r.vehicle.brand} {r.vehicle.model}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-slate-700 dark:border-slate-700 dark:text-slate-300">{r.item.serviceName}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right text-slate-700 dark:border-slate-700 dark:text-slate-300">{r.item.quantity}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right text-slate-700 dark:border-slate-700 dark:text-slate-300">{formatCurrency(r.item.unitPrice)}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right text-slate-700 dark:border-slate-700 dark:text-slate-300">{formatCurrency(r.item.subtotal)}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right font-semibold text-slate-900 dark:border-slate-700 dark:text-slate-100">{formatCurrency(r.totalAmount)}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-slate-700 dark:border-slate-700 dark:text-slate-300">{r.createdBy.name}</td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap text-slate-700 dark:border-slate-700 dark:text-slate-300">{formatDateShort(r.createdAt)}</td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap text-slate-700 dark:border-slate-700 dark:text-slate-300">{formatDateShort(r.startedAt)}</td>
                      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap text-slate-700 dark:border-slate-700 dark:text-slate-300">{formatDateShort(r.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-slate-500 dark:text-slate-400">
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
