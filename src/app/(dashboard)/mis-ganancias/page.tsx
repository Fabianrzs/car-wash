"use client";

import { useEffect, useState } from "react";
import { Wallet, Clock, CheckCircle } from "lucide-react";
import { PageLoader } from "@/components/ui/Spinner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatCurrency } from "@/lib/utils";
import { fetchApi } from "@/lib/utils/api";

interface Earning {
  id: string;
  amount: number;
  commissionRate: number;
  status: "PENDING" | "PAID";
  createdAt: string;
  order: { id: string; orderNumber: string; totalAmount: number; completedAt: string | null };
  payout: { id: string; paidAt: string } | null;
}

interface MyEarningsData {
  earnings: Earning[];
  pendingTotal: number;
  totalEarned: number;
}

export default function MisGananciasPage() {
  const [data, setData] = useState<MyEarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<MyEarningsData>("/api/commissions/my-earnings")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const earnings = data?.earnings ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Mis Ganancias</h1>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pendiente de cobro
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(data?.pendingTotal ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total ganado
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(data?.totalEarned ?? 0)}
          </p>
        </div>
      </div>

      {/* Tabla de ganancias */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Detalle de Ganancias</h2>

        {earnings.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
            <Wallet className="h-4 w-4" />
            Aún no tienes ganancias registradas
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Valor Orden</TableHead>
                <TableHead>Comisión</TableHead>
                <TableHead>Ganancia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.order.orderNumber}</TableCell>
                  <TableCell>{formatCurrency(Number(e.order.totalAmount))}</TableCell>
                  <TableCell>{Number(e.commissionRate).toFixed(1)}%</TableCell>
                  <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(Number(e.amount))}
                  </TableCell>
                  <TableCell>
                    {e.status === "PENDING" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        Pagado
                        {e.payout && (
                          <span className="text-emerald-500">
                            · {new Date(e.payout.paidAt).toLocaleDateString("es-CO")}
                          </span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(e.createdAt).toLocaleDateString("es-CO")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
