"use client";

import { useEffect, useState } from "react";
import { CreditCard, Plus, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { PageLoader } from "@/components/ui/Spinner";

interface PlanItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  interval: string;
  maxUsers: number;
  maxOrdersPerMonth: number;
  features: string[];
  isActive: boolean;
  _count: { tenants: number };
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    name: "", slug: "", description: "", price: "", interval: "MONTHLY",
    maxUsers: "5", maxOrdersPerMonth: "500", features: "",
  });

  const loadPlans = () => {
    setLoading(true);
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then(setPlans)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPlans(); }, []);

  const generateSlug = (val: string) =>
    val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

  const openModal = () => {
    setFormData({
      name: "", slug: "", description: "", price: "", interval: "MONTHLY",
      maxUsers: "5", maxOrdersPerMonth: "500", features: "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          price: Number(formData.price),
          interval: formData.interval,
          maxUsers: Number(formData.maxUsers),
          maxOrdersPerMonth: Number(formData.maxOrdersPerMonth),
          features: formData.features ? formData.features.split(",").map((f) => f.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Error al crear plan");
        return;
      }
      setShowModal(false);
      loadPlans();
    } catch {
      setFormError("Error de conexion");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Planes</h1>
        <Button onClick={openModal}>
          <Plus className="mr-1 h-4 w-4" />
          Nuevo Plan
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">{plan.name}</h2>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                plan.isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
              }`}>
                {plan.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              ${Number(plan.price).toLocaleString("es-CO")}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                /{plan.interval === "MONTHLY" ? "mes" : "año"}
              </span>
            </p>
            {plan.description && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{plan.description}</p>
            )}
            <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <p>Hasta {plan.maxUsers} usuarios</p>
              <p>Hasta {plan.maxOrdersPerMonth} ordenes/mes</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {plan._count.tenants} tenant{plan._count.tenants !== 1 ? "s" : ""}
              </p>
            </div>
            {Array.isArray(plan.features) && plan.features.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {(plan.features as string[]).map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {plans.length === 0 && (
          <p className="col-span-full text-center text-slate-500 dark:text-slate-400">
            No hay planes creados.
          </p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Plan">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}
          <Input
            id="plan-name"
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
            required
          />
          <Input
            id="plan-slug"
            label="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
            required
          />
          <Input
            id="plan-description"
            label="Descripcion"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              id="plan-price"
              label="Precio"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <div>
              <label htmlFor="plan-interval" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Intervalo
              </label>
              <select
                id="plan-interval"
                value={formData.interval}
                onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/10"
              >
                <option value="MONTHLY">Mensual</option>
                <option value="YEARLY">Anual</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              id="plan-maxUsers"
              label="Max Usuarios"
              type="number"
              value={formData.maxUsers}
              onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
            />
            <Input
              id="plan-maxOrders"
              label="Max Ordenes/Mes"
              type="number"
              value={formData.maxOrdersPerMonth}
              onChange={(e) => setFormData({ ...formData, maxOrdersPerMonth: e.target.value })}
            />
          </div>
          <Input
            id="plan-features"
            label="Features (separadas por coma)"
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
            placeholder="Feature 1, Feature 2, Feature 3"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={creating}>
              Crear Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
