"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Search, Plus } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import ManageTenantButton from "@/components/admin/ManageTenantButton";

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
    // Load plans for dropdown
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Tenants ({total})</h1>
        <Button onClick={openModal}>
          <Plus className="mr-1 h-4 w-4" />
          Nuevo Tenant
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, slug o email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Lavadero</th>
              <th className="hidden px-4 py-3 md:table-cell">Plan</th>
              <th className="px-4 py-3">Usuarios</th>
              <th className="hidden px-4 py-3 md:table-cell">Clientes</th>
              <th className="hidden px-4 py-3 md:table-cell">Ordenes</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No hay tenants
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/tenants/${t.id}`} className="flex items-center gap-2 text-purple-600 hover:underline">
                      <Building2 className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.slug}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">{t.plan?.name || "Sin plan"}</td>
                  <td className="px-4 py-3">{t._count.tenantUsers}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{t._count.clients}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{t._count.serviceOrders}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
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

      {/* Create Tenant Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Tenant">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}
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
            <label htmlFor="tenant-plan" className="mb-1 block text-sm font-medium text-gray-700">Plan</label>
            <select
              id="tenant-plan"
              value={formData.planId}
              onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
