"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, Users, ClipboardList, Car, Sparkles, Pencil, X, CreditCard, Loader2, FileText } from "lucide-react";
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

export default function AdminTenantDetailPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const [tenantInvoices, setTenantInvoices] = useState<TenantInvoice[]>([]);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    planId: "",
    trialEndsAt: "",
    isActive: true,
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
    return <PageLoader color="text-purple-600" />;
  }

  if (!tenant) {
    return <p className="text-gray-500">Tenant no encontrado</p>;
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
      <Link href="/admin/tenants" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2">
            <Building2 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-sm text-gray-500">{tenant.slug}.carwash.com</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          <ManageTenantButton
            slug={tenant.slug}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          />
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${tenant.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {tenant.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <s.icon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">{s.label}</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Informacion</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{tenant.email || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Telefono</dt>
              <dd className="text-gray-900">{tenant.phone || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Direccion</dt>
              <dd className="text-gray-900">{tenant.address || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Plan</dt>
              <dd className="text-gray-900">{tenant.plan?.name || "Sin plan"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Creado</dt>
              <dd className="text-gray-900">{new Date(tenant.createdAt).toLocaleDateString("es-CO")}</dd>
            </div>
          </dl>
        </div>

        {/* Subscription Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Suscripcion</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Plan asignado</dt>
              <dd className="text-gray-900">{tenant.plan?.name || "Sin plan"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Precio</dt>
              <dd className="text-gray-900">
                {tenant.plan
                  ? `$${Number(tenant.plan.price).toLocaleString("es-CO")}/${tenant.plan.interval === "MONTHLY" ? "mes" : "ano"}`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Fin de prueba</dt>
              <dd className="text-gray-900">
                {tenant.trialEndsAt
                  ? new Date(tenant.trialEndsAt).toLocaleDateString("es-CO")
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Stripe Customer ID</dt>
              <dd className="font-mono text-xs text-gray-900">{tenant.stripeCustomerId || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Stripe Subscription ID</dt>
              <dd className="font-mono text-xs text-gray-900">{tenant.stripeSubscriptionId || "—"}</dd>
            </div>
          </dl>
        </div>

        {/* Team */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-gray-900">
            Equipo ({tenant.tenantUsers.length})
          </h2>
          <div className="space-y-2">
            {tenant.tenantUsers.map((tu) => (
              <div key={tu.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{tu.user.name || tu.user.email}</p>
                  <p className="text-xs text-gray-500">{tu.user.email}</p>
                </div>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  {tu.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices */}
        {tenantInvoices.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Facturas ({tenantInvoices.length})</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Factura</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Plan</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Total</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">Estado</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tenantInvoices.map((inv) => {
                    const statusColors: Record<string, string> = {
                      PENDING: "bg-yellow-100 text-yellow-700",
                      PAID: "bg-green-100 text-green-700",
                      OVERDUE: "bg-red-100 text-red-700",
                      CANCELLED: "bg-gray-100 text-gray-500",
                    };
                    const statusLabels: Record<string, string> = {
                      PENDING: "Pendiente",
                      PAID: "Pagada",
                      OVERDUE: "Vencida",
                      CANCELLED: "Cancelada",
                    };
                    return (
                      <tr key={inv.id}>
                        <td className="px-3 py-2 font-medium text-gray-900">{inv.invoiceNumber}</td>
                        <td className="px-3 py-2 text-gray-600">{inv.plan?.name || "—"}</td>
                        <td className="px-3 py-2 text-right text-gray-900">${Number(inv.totalAmount).toLocaleString("es-CO")}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inv.status] || ""}`}>
                            {statusLabels[inv.status] || inv.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{new Date(inv.dueDate).toLocaleDateString("es-CO")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Editar Tenant</h2>
              <button onClick={() => setShowEditModal(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Telefono</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Direccion</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Plan</label>
                <select
                  value={editForm.planId}
                  onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Sin plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — ${Number(plan.price).toLocaleString("es-CO")}/{plan.interval === "MONTHLY" ? "mes" : "ano"}
                    </option>
                  ))}
                </select>
              </div>
              {isFreePlan && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fin de prueba</label>
                  <input
                    type="date"
                    value={editForm.trialEndsAt}
                    onChange={(e) => setEditForm({ ...editForm, trialEndsAt: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Dejar vacio para auto-asignar 30 dias</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Activo</label>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.isActive ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${editForm.isActive ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.name}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
