"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Building2, Users, ClipboardList, Car, Sparkles,
  Pencil, X, CreditCard, Loader2, FileText,
} from "lucide-react";
import Link from "next/link";

import ManageTenantButton from "@/components/admin/ManageTenantButton";
import { PageLoader } from "@/components/ui/Spinner";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  stripePriceId: string | null;
}

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  plan: Plan | null;
  tenantUsers: {
    id: string;
    role: string;
    user: { id: string; name: string | null; email: string };
  }[];
  _count: { clients: number; serviceOrders: number; vehicles: number; serviceTypes: number };
}

interface TenantInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  plan: { name: string } | null;
}

interface EditForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  planId: string;
  trialEndsAt: string;
  isActive: boolean;
}

const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  ADMIN: "bg-zinc-700 text-white dark:bg-slate-700 dark:text-slate-200",
  EMPLOYEE: "bg-zinc-300 text-zinc-700 dark:bg-slate-800 dark:text-slate-400",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
  CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagada",
  OVERDUE: "Vencida",
  CANCELLED: "Cancelada",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/10";

const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function AdminTenantDetailPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const [tenantInvoices, setTenantInvoices] = useState<TenantInvoice[]>([]);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "", email: "", phone: "", address: "", planId: "", trialEndsAt: "", isActive: true,
  });

  const fetchTenant = () => {
    fetch(`/api/admin/tenants/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTenant(data);
        setTenantInvoices(data.invoices || []);
        setEditForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          planId: data.plan?.id || "",
          trialEndsAt: data.trialEndsAt ? data.trialEndsAt.slice(0, 10) : "",
          isActive: data.isActive,
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTenant();
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((data) => setPlans(Array.isArray(data) ? data : []));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email || null,
          phone: editForm.phone || null,
          address: editForm.address || null,
          planId: editForm.planId || null,
          trialEndsAt: editForm.trialEndsAt || null,
          isActive: editForm.isActive,
        }),
      });
      if (res.ok) {
        setShowEditModal(false);
        setLoading(true);
        fetchTenant();
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!tenant) {
    return <p className="text-slate-500 dark:text-slate-400">Tenant no encontrado</p>;
  }

  const stats = [
    { label: "Clientes", value: tenant._count.clients, icon: Users },
    { label: "Vehiculos", value: tenant._count.vehicles, icon: Car },
    { label: "Ordenes", value: tenant._count.serviceOrders, icon: ClipboardList },
    { label: "Servicios", value: tenant._count.serviceTypes, icon: Sparkles },
  ];

  const selectedPlan = plans.find((p) => p.id === editForm.planId);
  const isFreePlan = selectedPlan && Number(selectedPlan.price) === 0 && !selectedPlan.stripePriceId;

  return (
    <div>
      <Link
        href="/admin/tenants"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
            <Building2 className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tenant.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{tenant.slug}.carwash.com</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          <ManageTenantButton
            slug={tenant.slug}
            className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          />
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${
            tenant.isActive
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
          }`}>
            {tenant.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <s.icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">{s.label}</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Informacion</h2>
          <dl className="space-y-2 text-sm">
            {[
              { label: "Email", value: tenant.email || "—" },
              { label: "Telefono", value: tenant.phone || "—" },
              { label: "Direccion", value: tenant.address || "—" },
              { label: "Plan", value: tenant.plan?.name || "Sin plan" },
              { label: "Creado", value: new Date(tenant.createdAt).toLocaleDateString("es-CO") },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="text-slate-900 dark:text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Subscription */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Suscripcion</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Plan asignado</dt>
              <dd className="text-slate-900 dark:text-slate-100">{tenant.plan?.name || "Sin plan"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Precio</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {tenant.plan
                  ? `$${Number(tenant.plan.price).toLocaleString("es-CO")}/${tenant.plan.interval === "MONTHLY" ? "mes" : "año"}`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Fin de prueba</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString("es-CO") : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Stripe Customer ID</dt>
              <dd className="font-mono text-xs text-slate-900 dark:text-slate-100">{tenant.stripeCustomerId || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Stripe Subscription ID</dt>
              <dd className="font-mono text-xs text-slate-900 dark:text-slate-100">{tenant.stripeSubscriptionId || "—"}</dd>
            </div>
          </dl>
        </div>

        {/* Team */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">
            Equipo ({tenant.tenantUsers.length})
          </h2>
          <div className="space-y-2">
            {tenant.tenantUsers.map((tu) => (
              <div
                key={tu.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{tu.user.name || tu.user.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{tu.user.email}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[tu.role] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                  {tu.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices */}
        {tenantInvoices.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Facturas ({tenantInvoices.length})
              </h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Factura</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Plan</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-500 dark:text-slate-400">Total</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-500 dark:text-slate-400">Estado</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tenantInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{inv.plan?.name || "—"}</td>
                      <td className="px-3 py-2 text-right text-slate-900 dark:text-slate-100">
                        ${Number(inv.totalAmount).toLocaleString("es-CO")}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_COLORS[inv.status] || ""}`}>
                          {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                        {new Date(inv.dueDate).toLocaleDateString("es-CO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Editar Tenant</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nombre</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Telefono</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Direccion</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Plan</label>
                <select
                  value={editForm.planId}
                  onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Sin plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — ${Number(plan.price).toLocaleString("es-CO")}/{plan.interval === "MONTHLY" ? "mes" : "año"}
                    </option>
                  ))}
                </select>
              </div>
              {isFreePlan && (
                <div>
                  <label className={labelClass}>Fin de prueba</label>
                  <input
                    type="date"
                    value={editForm.trialEndsAt}
                    onChange={(e) => setEditForm({ ...editForm, trialEndsAt: e.target.value })}
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Dejar vacio para auto-asignar 30 dias
                  </p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className={labelClass + " mb-0"}>Activo</label>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editForm.isActive
                      ? "bg-zinc-900 dark:bg-zinc-100"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform dark:bg-zinc-900 ${
                      editForm.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.name}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
