"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Map, Plus, Settings, Users } from "lucide-react";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { PageLoader } from "@/components/ui/Spinner";

interface FlowItem {
  id: string;
  key: string;
  title: string;
  description: string | null;
  isActive: boolean;
  _count: { steps: number; completions: number };
}

export default function AdminOnboardingPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({ key: "", title: "", description: "" });
  const [toggling, setToggling] = useState<string | null>(null);

  const loadFlows = () => {
    setLoading(true);
    fetch("/api/admin/onboarding")
      .then((res) => res.json())
      .then((data) => setFlows(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadFlows(); }, []);

  const openModal = () => {
    setFormData({ key: "", title: "", description: "" });
    setFormError("");
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Error al crear flow");
        return;
      }
      setShowModal(false);
      loadFlows();
    } catch {
      setFormError("Error de conexion");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (flow: FlowItem) => {
    setToggling(flow.id);
    try {
      await fetch(`/api/admin/onboarding/${flow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !flow.isActive }),
      });
      loadFlows();
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <OnboardingTour flowKey="admin-onboarding" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Onboarding</h1>
        <span data-onboarding="admin-onboarding-new-btn">
          <Button onClick={openModal}>
            <Plus className="mr-1 h-4 w-4" />
            Nuevo Flow
          </Button>
        </span>
      </div>

      <div data-onboarding="admin-onboarding-grid" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {flows.map((flow) => (
          <div
            key={flow.id}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex items-start gap-2">
              <Map className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-slate-900 dark:text-slate-100">{flow.title}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono">{flow.key}</p>
              </div>
              <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                flow.isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
              }`}>
                {flow.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>

            {flow.description && (
              <p className="mb-3 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{flow.description}</p>
            )}

            <div className="mb-4 flex gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Settings className="h-3.5 w-3.5" />
                {flow._count.steps} paso{flow._count.steps !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {flow._count.completions} completado{flow._count.completions !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => router.push(`/admin/onboarding/${flow.id}`)}
              >
                <Settings className="mr-1 h-3.5 w-3.5" />
                Configurar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={toggling === flow.id}
                onClick={() => handleToggle(flow)}
              >
                {flow.isActive ? "Desactivar" : "Activar"}
              </Button>
            </div>
          </div>
        ))}

        {flows.length === 0 && (
          <p className="col-span-full text-center text-slate-500 dark:text-slate-400">
            No hay flows de onboarding. Crea uno para comenzar.
          </p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Flow de Onboarding">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}
          <Input
            id="flow-key"
            label="Key (slug único)"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
            placeholder="orders, clients, dashboard..."
            required
          />
          <Input
            id="flow-title"
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-zinc-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={creating}>
              Crear Flow
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
