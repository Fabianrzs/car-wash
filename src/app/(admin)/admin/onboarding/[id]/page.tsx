"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import Modal from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";

// --- Types ---
interface OnboardingStep {
  id: string;
  title: string;
  description: string | null;
  target: string;
  placement: string;
  order: number;
}

interface PlanItem { id: string; name: string; slug: string }

interface TenantOverride {
  flowId: string;
  tenantId: string;
  isEnabled: boolean;
  tenant: { id: string; name: string; slug: string };
}

interface FlowDetail {
  id: string;
  key: string;
  title: string;
  description: string | null;
  isActive: boolean;
  steps: OnboardingStep[];
  planAccess: { planId: string; plan: PlanItem }[];
  tenantOverrides: TenantOverride[];
  _count: { completions: number };
}

const PLACEMENTS = ["top", "bottom", "left", "right", "top-start", "top-end", "bottom-start", "bottom-end", "left-start", "right-start"];

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-zinc-300";

export default function AdminOnboardingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [flow, setFlow] = useState<FlowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [infoForm, setInfoForm] = useState({ title: "", description: "", isActive: true });
  const [infoMsg, setInfoMsg] = useState("");
  const [infoError, setInfoError] = useState("");

  // Steps
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [stepForm, setStepForm] = useState({ title: "", description: "", target: "", placement: "bottom", order: "0" });
  const [stepSaving, setStepSaving] = useState(false);
  const [stepError, setStepError] = useState("");

  // Plans
  const [allPlans, setAllPlans] = useState<PlanItem[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [plansSaving, setPlansSaving] = useState(false);
  const [plansMsg, setPlansMsg] = useState("");

  // Tenant overrides
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantResults, setTenantResults] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [tenantSearching, setTenantSearching] = useState(false);
  const [tenantAddIsEnabled, setTenantAddIsEnabled] = useState(true);
  const [tenantSaving, setTenantSaving] = useState(false);
  const [tenantError, setTenantError] = useState("");

  const loadFlow = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/onboarding/${id}`);
    const data: FlowDetail = await res.json();
    setFlow(data);
    setInfoForm({ title: data.title, description: data.description ?? "", isActive: data.isActive });
    setLoading(false);
  };

  const loadPlans = async () => {
    const res = await fetch(`/api/admin/onboarding/${id}/plans`);
    const data = await res.json();
    setAllPlans(data.allPlans ?? []);
    setSelectedPlanIds(data.selectedPlanIds ?? []);
  };

  useEffect(() => {
    loadFlow();
    loadPlans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- Info section ---
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setInfoMsg("");
    setInfoError("");
    try {
      const res = await fetch(`/api/admin/onboarding/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(infoForm),
      });
      if (res.ok) {
        setInfoMsg("Guardado correctamente");
        loadFlow();
      } else {
        const d = await res.json();
        setInfoError(d.error || "Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  // --- Steps ---
  const openCreateStep = () => {
    const nextOrder = (flow?.steps.length ?? 0) + 1;
    setEditingStep(null);
    setStepForm({ title: "", description: "", target: "", placement: "bottom", order: String(nextOrder) });
    setStepError("");
    setShowStepModal(true);
  };

  const openEditStep = (step: OnboardingStep) => {
    setEditingStep(step);
    setStepForm({
      title: step.title,
      description: step.description ?? "",
      target: step.target,
      placement: step.placement,
      order: String(step.order),
    });
    setStepError("");
    setShowStepModal(true);
  };

  const handleSaveStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepSaving(true);
    setStepError("");
    try {
      const body = {
        ...stepForm,
        order: parseInt(stepForm.order, 10),
      };
      const url = editingStep
        ? `/api/admin/onboarding/${id}/steps/${editingStep.id}`
        : `/api/admin/onboarding/${id}/steps`;
      const method = editingStep ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowStepModal(false);
        loadFlow();
      } else {
        const d = await res.json();
        setStepError(d.error || "Error al guardar paso");
      }
    } finally {
      setStepSaving(false);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("¿Eliminar este paso?")) return;
    await fetch(`/api/admin/onboarding/${id}/steps/${stepId}`, { method: "DELETE" });
    loadFlow();
  };

  // --- Plans ---
  const handleSavePlans = async () => {
    setPlansSaving(true);
    setPlansMsg("");
    try {
      await fetch(`/api/admin/onboarding/${id}/plans`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planIds: selectedPlanIds }),
      });
      setPlansMsg(selectedPlanIds.length === 0 ? "Guardado: acceso para todos los planes" : "Lista de planes guardada");
      loadPlans();
    } finally {
      setPlansSaving(false);
    }
  };

  // --- Tenant overrides ---
  const searchTenants = async () => {
    if (!tenantSearch.trim()) return;
    setTenantSearching(true);
    try {
      const res = await fetch(`/api/admin/tenants?search=${encodeURIComponent(tenantSearch)}&page=1`);
      const data = await res.json();
      setTenantResults(Array.isArray(data) ? data.slice(0, 10) : data.tenants?.slice(0, 10) ?? []);
    } finally {
      setTenantSearching(false);
    }
  };

  const handleAddTenantOverride = async (tenantId: string) => {
    setTenantSaving(true);
    setTenantError("");
    try {
      const res = await fetch(`/api/admin/onboarding/${id}/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, isEnabled: tenantAddIsEnabled }),
      });
      if (res.ok) {
        setShowTenantModal(false);
        setTenantSearch("");
        setTenantResults([]);
        loadFlow();
      } else {
        const d = await res.json();
        setTenantError(d.error || "Error al agregar override");
      }
    } finally {
      setTenantSaving(false);
    }
  };

  const handleDeleteTenantOverride = async (tenantId: string) => {
    if (!confirm("¿Eliminar este override?")) return;
    await fetch(`/api/admin/onboarding/${id}/tenants?tenantId=${tenantId}`, { method: "DELETE" });
    loadFlow();
  };

  if (loading) return <PageLoader />;
  if (!flow) return <div className="p-8 text-slate-500">Flow no encontrado</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/onboarding">
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{flow.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{flow.key}</p>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
          flow.isActive
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
            : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
        }`}>
          {flow.isActive ? "Activo" : "Inactivo"} · {flow._count.completions} completados
        </span>
      </div>

      {/* Section 1: Info */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Información del Flow</h2>
        <form onSubmit={handleSaveInfo} className="space-y-4">
          {infoError && <Alert variant="error">{infoError}</Alert>}
          {infoMsg && <Alert variant="success">{infoMsg}</Alert>}
          <Input
            id="info-title"
            label="Título"
            value={infoForm.title}
            onChange={(e) => setInfoForm({ ...infoForm, title: e.target.value })}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
            <textarea
              value={infoForm.description}
              onChange={(e) => setInfoForm({ ...infoForm, description: e.target.value })}
              rows={2}
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="info-active"
              type="checkbox"
              checked={infoForm.isActive}
              onChange={(e) => setInfoForm({ ...infoForm, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 accent-zinc-900"
            />
            <label htmlFor="info-active" className="text-sm text-slate-700 dark:text-slate-300">Activo</label>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Guardar</Button>
          </div>
        </form>
      </section>

      {/* Section 2: Steps */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Pasos ({flow.steps.length})
          </h2>
          <Button size="sm" onClick={openCreateStep}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Agregar Paso
          </Button>
        </div>

        {flow.steps.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Sin pasos. Agrega el primero.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                  <th className="pb-2 pr-4 text-xs font-medium text-slate-500">#</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-slate-500">Título</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-slate-500">Target</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-slate-500">Posición</th>
                  <th className="pb-2 text-xs font-medium text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {flow.steps.map((step) => (
                  <tr key={step.id}>
                    <td className="py-2 pr-4 text-slate-400">{step.order}</td>
                    <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100">{step.title}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-500">{step.target}</td>
                    <td className="py-2 pr-4 text-slate-500">{step.placement}</td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditStep(step)}
                          className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className="rounded p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 3: Plans */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Acceso por Plan</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Sin selección = acceso para todos los planes. Con selección = solo esos planes.
        </p>
        {plansMsg && <Alert variant="success" className="mb-3">{plansMsg}</Alert>}
        <div className="mb-4 flex flex-wrap gap-3">
          {allPlans.map((plan) => (
            <label key={plan.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedPlanIds.includes(plan.id)}
                onChange={(e) => {
                  setSelectedPlanIds(
                    e.target.checked
                      ? [...selectedPlanIds, plan.id]
                      : selectedPlanIds.filter((pid) => pid !== plan.id)
                  );
                }}
                className="h-4 w-4 rounded border-slate-300 accent-zinc-900"
              />
              <span className="text-slate-700 dark:text-slate-300">{plan.name}</span>
            </label>
          ))}
          {allPlans.length === 0 && (
            <p className="text-sm text-slate-400">No hay planes activos.</p>
          )}
        </div>
        <div className="flex justify-end">
          <Button size="sm" loading={plansSaving} onClick={handleSavePlans}>
            Guardar acceso por plan
          </Button>
        </div>
      </section>

      {/* Section 4: Tenant overrides */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Overrides por Tenant</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              isEnabled=false bloquea ese tenant. isEnabled=true fuerza la visibilidad (gana sobre restricción de plan).
            </p>
          </div>
          <Button size="sm" onClick={() => { setShowTenantModal(true); setTenantError(""); setTenantSearch(""); setTenantResults([]); }}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Agregar
          </Button>
        </div>

        {flow.tenantOverrides.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Sin overrides por tenant.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {flow.tenantOverrides.map((o) => (
              <div key={o.tenantId} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{o.tenant.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{o.tenant.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    o.isEnabled
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                  }`}>
                    {o.isEnabled ? "Habilitado" : "Bloqueado"}
                  </span>
                  <button
                    onClick={() => handleDeleteTenantOverride(o.tenantId)}
                    className="rounded p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Step Modal */}
      <Modal
        isOpen={showStepModal}
        onClose={() => setShowStepModal(false)}
        title={editingStep ? "Editar Paso" : "Nuevo Paso"}
      >
        <form onSubmit={handleSaveStep} className="space-y-4">
          {stepError && <Alert variant="error">{stepError}</Alert>}
          <Input
            id="step-title"
            label="Título"
            value={stepForm.title}
            onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
            <textarea
              value={stepForm.description}
              onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
              rows={2}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Target (data-onboarding value)
            </label>
            <input
              type="text"
              value={stepForm.target}
              onChange={(e) => setStepForm({ ...stepForm, target: e.target.value })}
              placeholder="orders-new-btn"
              required
              className={inputCls}
            />
            <p className="mt-1 text-xs text-slate-400">
              El valor del atributo <code className="font-mono">data-onboarding="..."</code> del elemento en la página.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Posición</label>
              <select
                value={stepForm.placement}
                onChange={(e) => setStepForm({ ...stepForm, placement: e.target.value })}
                className={inputCls}
              >
                {PLACEMENTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <Input
              id="step-order"
              label="Orden"
              type="number"
              value={stepForm.order}
              onChange={(e) => setStepForm({ ...stepForm, order: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowStepModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={stepSaving}>
              {editingStep ? "Guardar" : "Crear Paso"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Tenant Override Modal */}
      <Modal
        isOpen={showTenantModal}
        onClose={() => setShowTenantModal(false)}
        title="Agregar Override de Tenant"
      >
        <div className="space-y-4">
          {tenantError && <Alert variant="error">{tenantError}</Alert>}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Buscar tenant
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchTenants())}
                placeholder="Nombre o slug..."
                className={inputCls}
              />
              <Button size="sm" variant="secondary" loading={tenantSearching} onClick={searchTenants}>
                Buscar
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="tenant-enabled"
              type="checkbox"
              checked={tenantAddIsEnabled}
              onChange={(e) => setTenantAddIsEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-zinc-900"
            />
            <label htmlFor="tenant-enabled" className="text-sm text-slate-700 dark:text-slate-300">
              Habilitado (fuerza visibilidad) / Desmarcado = Bloqueado
            </label>
          </div>

          {tenantResults.length > 0 && (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
              {tenantResults.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{t.slug}</p>
                  </div>
                  <Button size="sm" loading={tenantSaving} onClick={() => handleAddTenantOverride(t.id)}>
                    Agregar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
