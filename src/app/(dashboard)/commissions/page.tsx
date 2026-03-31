"use client";

import { useEffect, useState, useCallback } from "react";
import { DollarSign, User, CheckCircle, Trash2 } from "lucide-react";
import { PageLoader } from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatCurrency } from "@/lib/utils";
import { fetchApi } from "@/lib/utils/api";

interface Employee {
  id: string;
  name: string | null;
  email: string;
}

interface Earning {
  id: string;
  amount: number;
  commissionRate: number;
  status: "PENDING" | "PAID";
  createdAt: string;
  order: { id: string; orderNumber: string; totalAmount: number; completedAt: string | null };
  payout: { id: string; paidAt: string } | null;
}

interface Payout {
  id: string;
  totalAmount: number;
  notes: string | null;
  paidAt: string;
  user: { id: string; name: string | null; email: string };
  paidBy: { id: string; name: string | null };
  earnings: Array<{ id: string; amount: number; order: { orderNumber: string } }>;
}

interface EarningsData {
  earnings: Earning[];
  pendingTotal: number;
}

export default function CommissionsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [selectedEarningIds, setSelectedEarningIds] = useState<string[]>([]);
  const [payNotes, setPayNotes] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cancellingPayoutId, setCancellingPayoutId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      fetchApi<Array<{ role: string; user: Employee }>>("/api/tenant/team"),
      fetchApi<Payout[]>("/api/commissions/payouts"),
    ])
      .then(([teamData, payoutsData]) => {
        const emps = (teamData ?? [])
          .filter((m) => m.role === "EMPLOYEE")
          .map((m) => m.user);
        setEmployees(emps);
        setPayouts(payoutsData ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadEarnings = useCallback(async (userId: string) => {
    if (!userId) return;
    setLoadingEarnings(true);
    setSelectedEarningIds([]);
    setError("");
    try {
      const data = await fetchApi<EarningsData>(`/api/commissions/earnings?userId=${userId}&status=PENDING`);
      setEarningsData(data);
    } finally {
      setLoadingEarnings(false);
    }
  }, []);

  const handleSelectEmployee = (userId: string) => {
    setSelectedUserId(userId);
    loadEarnings(userId);
  };

  const toggleEarning = (id: string) => {
    setSelectedEarningIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const pending = (earningsData?.earnings ?? []).filter((e) => e.status === "PENDING");
    if (selectedEarningIds.length === pending.length) {
      setSelectedEarningIds([]);
    } else {
      setSelectedEarningIds(pending.map((e) => e.id));
    }
  };

  const handlePay = async () => {
    if (selectedEarningIds.length === 0 || !selectedUserId) return;
    setPaying(true);
    setError("");
    try {
      await fetchApi("/api/commissions/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, earningIds: selectedEarningIds, notes: payNotes || undefined }),
      });
      setSuccess("Pago registrado correctamente");
      setShowPayModal(false);
      setPayNotes("");
      setSelectedEarningIds([]);
      await loadEarnings(selectedUserId);
      const updatedPayouts = await fetchApi<Payout[]>(`/api/commissions/payouts?userId=${selectedUserId}`);
      setPayouts(updatedPayouts);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar pago");
    } finally {
      setPaying(false);
    }
  };

  const handleCancelPayout = async (payoutId: string) => {
    if (!confirm("¿Cancelar este pago? Las ganancias volverán a estado pendiente.")) return;
    setCancellingPayoutId(payoutId);
    setError("");
    try {
      await fetchApi(`/api/commissions/payouts/${payoutId}`, { method: "DELETE" });
      setSuccess("Pago cancelado correctamente");
      const updatedPayouts = await fetchApi<Payout[]>("/api/commissions/payouts");
      setPayouts(updatedPayouts ?? []);
      if (selectedUserId) await loadEarnings(selectedUserId);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar pago");
    } finally {
      setCancellingPayoutId(null);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === selectedUserId);
  const pendingEarnings = (earningsData?.earnings ?? []).filter((e) => e.status === "PENDING");
  const selectedTotal = pendingEarnings
    .filter((e) => selectedEarningIds.includes(e.id))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  if (loading) return <PageLoader />;

  const inputClass = "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-zinc-300";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Comisiones de Lavadores</h1>
      </div>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Selector de empleado */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Seleccionar Lavador
        </label>
        <select
          value={selectedUserId}
          onChange={(e) => handleSelectEmployee(e.target.value)}
          className={inputClass}
        >
          <option value="">-- Selecciona un empleado --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name ?? emp.email}
            </option>
          ))}
        </select>
      </div>

      {/* Ganancias pendientes */}
      {selectedUserId && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ganancias pendientes — {selectedEmployee?.name ?? selectedEmployee?.email}
              </h2>
              {earningsData && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Total pendiente: <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(earningsData.pendingTotal)}</span>
                </p>
              )}
            </div>
            {selectedEarningIds.length > 0 && (
              <Button
                onClick={() => setShowPayModal(true)}
                className="text-sm"
              >
                Registrar Pago ({formatCurrency(selectedTotal)})
              </Button>
            )}
          </div>

          {loadingEarnings ? (
            <div className="py-8 text-center text-sm text-slate-400">Cargando...</div>
          ) : pendingEarnings.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
              <CheckCircle className="h-4 w-4" />
              Sin ganancias pendientes
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedEarningIds.length === pendingEarnings.length}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Valor Orden</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Ganancia</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEarnings.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedEarningIds.includes(e.id)}
                        onChange={() => toggleEarning(e.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.order.orderNumber}</TableCell>
                    <TableCell>{formatCurrency(Number(e.order.totalAmount))}</TableCell>
                    <TableCell>{Number(e.commissionRate).toFixed(1)}%</TableCell>
                    <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(Number(e.amount))}
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
      )}

      {/* Historial de pagos */}
      {payouts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Historial de Pagos</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lavador</TableHead>
                <TableHead>Total Pagado</TableHead>
                <TableHead>Órdenes</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-10">{" "}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{p.user.name ?? p.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(Number(p.totalAmount))}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {p.earnings.map((e) => e.order.orderNumber).join(", ")}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{p.paidBy.name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(p.paidAt).toLocaleDateString("es-CO")}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleCancelPayout(p.id)}
                      disabled={cancellingPayoutId === p.id}
                      title="Cancelar pago"
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal pago */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
              Registrar Pago
            </h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {selectedEmployee?.name ?? selectedEmployee?.email} · {selectedEarningIds.length} orden(es) · <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(selectedTotal)}</span>
            </p>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notas (opcional)
            </label>
            <textarea
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Ej: Pago en efectivo semana del 31 marzo"
              rows={3}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowPayModal(false)} disabled={paying}>
                Cancelar
              </Button>
              <Button onClick={handlePay} loading={paying}>
                Confirmar Pago
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
