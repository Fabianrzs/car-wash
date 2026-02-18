"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Check, AlertTriangle, Crown, Loader2, FileText, Clock, ArrowRight, XCircle } from "lucide-react";
import { PageLoader } from "@/components/ui/Spinner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  interval: string;
  maxUsers: number;
  maxOrdersPerMonth: number;
  features: string[];
}

interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  plan: { id: string; name: string } | null;
}

interface ScheduledChange {
  id: string;
  effectiveDate: string;
  toPlan: { name: string; price: number };
}

interface BillingData {
  plan: Plan | null;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  planStatus: {
    isBlocked: boolean;
    reason: string | null;
    daysLeft: number | null;
    pendingInvoiceId: string | null;
  } | null;
  invoices: InvoiceSummary[];
  scheduledChange: ScheduledChange | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Pagada", color: "bg-green-100 text-green-700" },
  OVERDUE: { label: "Vencida", color: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelada", color: "bg-gray-100 text-gray-500" },
};

export default function BillingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = () => {
    Promise.all([
      fetch("/api/tenant/billing").then((res) => res.json()),
      fetch("/api/plans").then((res) => res.json()),
    ])
      .then(([billingData, plansData]) => {
        setBilling(billingData);
        setPlans(Array.isArray(plansData) ? plansData : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleChangePlan = async (planId: string | null) => {
    setChangingPlan(planId || "none");
    setMessage(null);
    try {
      const res = await fetch("/api/tenant/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change-plan", planId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Error al cambiar el plan" });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.invoiceId) {
        router.push(`/billing/invoices/${data.invoiceId}`);
        return;
      }

      if (data.success) {
        setMessage({ type: "success", text: data.message || "Plan actualizado correctamente" });
        fetchData();
      }
    } catch (error) {
      console.error("Error al cambiar plan:", error);
      setMessage({ type: "error", text: "Error de conexion. Intenta de nuevo." });
    } finally {
      setChangingPlan(null);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const trialEndsAt = billing?.trialEndsAt ? new Date(billing.trialEndsAt) : null;
  const daysLeft = billing?.planStatus?.daysLeft;
  const trialExpired = daysLeft !== null && daysLeft !== undefined && daysLeft <= 0;
  const trialExpiringSoon = daysLeft !== null && daysLeft !== undefined && daysLeft > 0 && daysLeft <= 7;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-gray-400" />
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Facturacion</h1>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-6 flex items-center justify-between gap-3 rounded-xl border p-4 ${
          message.type === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <Check className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Current Plan Info */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        {billing?.plan ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Plan Actual: {billing.plan.name}</h2>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Activo</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
                ${Number(billing.plan.price).toLocaleString("es-CO")}
                <span className="text-sm font-normal text-gray-500">
                  /{billing.plan.interval === "MONTHLY" ? "mes" : "ano"} + IVA
                </span>
              </p>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>Hasta {billing.plan.maxUsers} usuarios</p>
                <p>Hasta {billing.plan.maxOrdersPerMonth} ordenes/mes</p>
                {trialEndsAt && (
                  <p className="font-medium">
                    Vigencia hasta: {trialEndsAt.toLocaleDateString("es-CO")}
                    {daysLeft !== null && daysLeft !== undefined && daysLeft > 0 && (
                      <span className="ml-1 text-gray-400">({daysLeft} dias restantes)</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <CreditCard className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="font-medium text-gray-900">No tienes un plan activo</p>
            <p className="text-sm text-gray-500">Selecciona un plan para comenzar. Debes pagar primero para activar el servicio.</p>
          </div>
        )}
      </div>

      {/* Scheduled Plan Change */}
      {billing?.scheduledChange && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Clock className="h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="font-medium text-blue-800">Cambio de plan programado</p>
            <p className="text-sm text-blue-600">
              Cambiaras al plan <strong>{billing.scheduledChange.toPlan.name}</strong> el{" "}
              {new Date(billing.scheduledChange.effectiveDate).toLocaleDateString("es-CO")}
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {trialExpired && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-medium text-red-800">Tu periodo de servicio ha expirado</p>
            <p className="text-sm text-red-600">Renueva tu plan pagando la factura pendiente o selecciona un nuevo plan.</p>
          </div>
        </div>
      )}

      {trialExpiringSoon && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">
              Tu plan vence en {daysLeft} dia{daysLeft !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-yellow-600">Renueva tu suscripcion para no perder acceso.</p>
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      {billing?.invoices && billing.invoices.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Facturas Recientes</h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 md:px-4 md:py-3">Factura</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 md:px-4 md:py-3">Plan</th>
                  <th className="hidden px-2 py-2 text-left font-medium text-gray-500 md:table-cell md:px-4 md:py-3">Periodo</th>
                  <th className="px-2 py-2 text-right font-medium text-gray-500 md:px-4 md:py-3">Total</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 md:px-4 md:py-3">Estado</th>
                  <th className="px-2 py-2 text-right font-medium text-gray-500 md:px-4 md:py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {billing.invoices.map((inv) => {
                  const st = STATUS_LABELS[inv.status] || STATUS_LABELS.PENDING;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-2 py-2 font-medium text-gray-900 md:px-4 md:py-3">{inv.invoiceNumber}</td>
                      <td className="px-2 py-2 text-gray-600 md:px-4 md:py-3">{inv.plan?.name || "—"}</td>
                      <td className="hidden px-2 py-2 text-gray-600 md:table-cell md:px-4 md:py-3">
                        {new Date(inv.periodStart).toLocaleDateString("es-CO")} -{" "}
                        {new Date(inv.periodEnd).toLocaleDateString("es-CO")}
                      </td>
                      <td className="px-2 py-2 text-right font-medium text-gray-900 md:px-4 md:py-3">
                        ${Number(inv.totalAmount).toLocaleString("es-CO")}
                      </td>
                      <td className="px-2 py-2 text-center md:px-4 md:py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right md:px-4 md:py-3">
                        <button
                          onClick={() => router.push(`/billing/invoices/${inv.id}`)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          Ver <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Planes Disponibles</h2>
      <p className="mb-4 text-sm text-gray-500">
        Selecciona un plan para generar una factura. El servicio se activa una vez recibido el pago via PSE o tarjeta de credito.
      </p>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = billing?.plan?.id === plan.id;
          const features: string[] = Array.isArray(plan.features) ? plan.features : [];
          const isFree = Number(plan.price) === 0;

          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 bg-white p-4 transition-shadow hover:shadow-md md:p-6 ${
                isCurrent ? "border-blue-500 shadow-md" : "border-gray-200"
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-4 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
                  Plan Actual
                </span>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                )}
              </div>
              <p className="mb-1 text-2xl font-bold text-gray-900 md:text-3xl">
                {isFree ? "Gratis" : (
                  <>${Number(plan.price).toLocaleString("es-CO")}</>
                )}
                {!isFree && (
                  <span className="text-sm font-normal text-gray-500">
                    /{plan.interval === "MONTHLY" ? "mes" : "ano"}
                  </span>
                )}
              </p>
              {!isFree && (
                <p className="mb-4 text-xs text-gray-400">+ IVA (19%)</p>
              )}
              {isFree && <div className="mb-4" />}
              <ul className="mb-6 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Hasta {plan.maxUsers} usuarios</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Hasta {plan.maxOrdersPerMonth} ordenes/mes</li>
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> {f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <button disabled className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed">
                  Plan Actual
                </button>
              ) : (
                <button
                  onClick={() => handleChangePlan(plan.id)}
                  disabled={changingPlan !== null}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {changingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                  {isFree ? "Activar Gratis" : "Seleccionar y Pagar"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Disconnect Plan */}
      {billing?.plan && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Desvincular plan</h3>
              <p className="text-sm text-gray-500">Quitar tu plan actual. Perderas acceso a las funciones del sistema.</p>
            </div>
            <button
              onClick={() => handleChangePlan(null)}
              disabled={changingPlan !== null}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {changingPlan === "none" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Desvincular"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
