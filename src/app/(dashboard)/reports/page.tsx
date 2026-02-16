"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import StatsCard from "@/components/dashboard/StatsCard";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, ClipboardList, TrendingUp, CheckCircle, Download, Calendar } from "lucide-react";

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

export default function ReportsPage() {
  const [period, setPeriod] = useState("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    let url = `/api/reports?period=${period}`;
    if (period === "custom" && startDate && endDate) {
      url = `/api/reports?period=custom&startDate=${startDate}&endDate=${endDate}`;
    }
    const res = await fetch(url);
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    if (period !== "custom") {
      fetchReport();
    }
  }, [period]);

  const handleCustomSearch = () => {
    if (startDate && endDate) {
      fetchReport();
    }
  };

  const exportCSV = () => {
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
      data.topServices.forEach((s) => {
        lines.push(`${s.name},${s.totalQuantity},${s.totalRevenue}`);
      });
      lines.push("");
    }

    if (data.dailyBreakdown.length > 0) {
      lines.push("Desglose Diario");
      lines.push("Fecha,Ordenes,Ingresos");
      data.dailyBreakdown.forEach((d) => {
        lines.push(`${d.date},${d.orders},${d.income}`);
      });
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-carwash-${period === "custom" ? `${startDate}_${endDate}` : period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <PageHeader title="Reportes" description="Resumen de ingresos y servicios">
        {data && (
          <Button variant="secondary" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        )}
      </PageHeader>

      <div className="mt-6">
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

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : data ? (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Ingresos Totales"
                value={formatCurrency(data.totalIncome)}
                icon={DollarSign}
              />
              <StatsCard
                title="Total Ordenes"
                value={String(data.orderCount)}
                icon={ClipboardList}
              />
              <StatsCard
                title="Ticket Promedio"
                value={formatCurrency(data.averageOrderValue)}
                icon={TrendingUp}
              />
              <StatsCard
                title="Completadas"
                value={String(data.completedOrders)}
                icon={CheckCircle}
              />
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
      </div>
    </div>
  );
}
