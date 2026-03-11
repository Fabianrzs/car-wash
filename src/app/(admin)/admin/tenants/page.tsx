"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Search, Plus } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";

import ManageTenantButton from "@/components/admin/ManageTenantButton";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  plan: { id: string; name: string } | null;
  _count: { tenantUsers: number; serviceOrders: number; clients: number };
}

interface PlanOption {
  id: string;
  name: string;
  slug: string;
  price: number;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const [showModal, setShowModal] = useState(false);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [formData, setFormData] = useState({
    name: "", slug: "", email: "", phone: "", address: "", planId: "", ownerEmail: "",
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const loadTenants = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedSearch) params.set("search", debouncedSearch);

    fetch(`/api/admin/tenants?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setTenants(data.tenants);
        setTotal(data.total);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTenants(); }, [page, debouncedSearch]);

  const openModal = () => {
    setFormData({ name: "", slug: "", email: "", phone: "", address: "", planId: "", ownerEmail: "" });
    setFormError("");
    setShowModal(true);
    fetch("/api/admin/plans").then((r) => r.json()).then(setPlans).catch(() => {});
  };

  const generateSlug = (val: string) =>
    val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          planId: formData.planId || undefined,
          ownerEmail: formData.ownerEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Error al crear tenant");
        return;
      }
      setShowModal(false);
      loadTenants();
    } catch {
      setFormError("Error de conexion");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <OnboardingTour flowKey="admin-tenants" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 md:text-2xl">
          Tenants ({total})
        </h1>
        <span data-onboarding="admin-tenants-new-btn">
          <Button onClick={openModal}>
            <Plus className="mr-1 h-4 w-4" />
            Nuevo Tenant
          </Button>
        </span>
      </div>

      <div data-onboarding="admin-tenants-search" className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, slug o email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/10"
          />
        </div>
      </div>

      <div data-onboarding="admin-tenants-table" className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Lavadero</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Plan</th>
              <th className="px-4 py-3 font-medium">Usuarios</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Clientes</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Ordenes</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Cargando...
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No hay tenants
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/tenants/${t.id}`} className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <div>
                        <p className="font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100">{t.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{t.slug}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-400 md:table-cell">
                    {t.plan?.name || <span className="text-slate-400 dark:text-slate-500">Sin plan</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{t._count.tenantUsers}</td>
                  <td className="hidden px-4 py-3 text-slate-700 dark:text-slate-300 md:table-cell">{t._count.clients}</td>
                  <td className="hidden px-4 py-3 text-slate-700 dark:text-slate-300 md:table-cell">{t._count.serviceOrders}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                    }`}>
                      {t.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ManageTenantButton slug={t.slug} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={pages} onPageChange={setPage} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Tenant">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}
          <Input
            id="tenant-name"
            label="Nombre del lavadero"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
            }}
            required
          />
          <Input
            id="tenant-slug"
            label="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
            required
          />
          <Input
            id="tenant-email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            id="tenant-phone"
            label="Telefono"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            id="tenant-address"
            label="Direccion"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div>
            <label htmlFor="tenant-plan" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Plan
            </label>
            <select
              id="tenant-plan"
              value={formData.planId}
              onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/10"
            >
              <option value="">Sin plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${Number(p.price).toLocaleString("es-CO")})
                </option>
              ))}
            </select>
          </div>
          <Input
            id="tenant-owner"
            label="Email del propietario (opcional)"
            type="email"
            value={formData.ownerEmail}
            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
            placeholder="Si el usuario no existe, se creara con password temporal"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={creating}>
              Crear Tenant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
