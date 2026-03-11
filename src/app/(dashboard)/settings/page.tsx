"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { PageLoader } from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    logoUrl: "",
  });

  useEffect(() => {
    fetch("/api/tenant/settings")
      .then((res) => res.json())
      .then((data) => {
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          logoUrl: data.logoUrl || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setSaveError("");

    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Error al guardar la configuracion");
      }
    } catch {
      setSaveError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const inputClass = "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-zinc-300";

  return (
    <div className="mx-auto max-w-2xl">
      <OnboardingTour flowKey="settings" />
      <div className="mb-6 flex items-center gap-2">
        <Settings className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Configuracion del Lavadero
        </h1>
      </div>

      <form data-onboarding="settings-form" onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Telefono</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Direccion</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={inputClass}
          />
        </div>

        {success && (
          <Alert variant="success">Configuracion actualizada correctamente</Alert>
        )}
        {saveError && (
          <Alert variant="error">{saveError}</Alert>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={saving}>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
