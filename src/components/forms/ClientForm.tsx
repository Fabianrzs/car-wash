"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";

interface ClientFormData {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isFrequent: boolean;
}

interface VehicleData {
  plate: string;
  brand: string;
  model: string;
  vehicleType: string;
}

interface ClientFormProps {
  initialData?: ClientFormData;
  onSuccess: () => void;
}

export default function ClientForm({ initialData, onSuccess }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    notes: initialData?.notes || "",
    isFrequent: initialData?.isFrequent || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const isEditMode = !!initialData?.id;

  // Optional vehicle
  const [addVehicle, setAddVehicle] = useState(false);
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    plate: "",
    brand: "",
    model: "",
    vehicleType: "SEDAN",
  });
  const [vehicleErrors, setVehicleErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "El telefono es requerido";
    } else if (formData.phone.trim().length < 7) {
      newErrors.phone = "El telefono debe tener al menos 7 digitos";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es valido";
    }

    if (addVehicle) {
      const ve: Record<string, string> = {};
      if (!vehicleData.plate.trim()) ve.plate = "La placa es requerida";
      if (!vehicleData.brand.trim()) ve.brand = "La marca es requerida";
      if (!vehicleData.model.trim()) ve.model = "El modelo es requerido";
      setVehicleErrors(ve);
      if (Object.keys(ve).length > 0) {
        setErrors(newErrors);
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    try {
      const url = isEditMode
        ? `/api/clients/${initialData!.id}`
        : "/api/clients";
      const method = isEditMode ? "PUT" : "POST";

      const payload = {
        ...formData,
        ...(addVehicle && !isEditMode ? { vehicle: vehicleData } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar el cliente");
      }

      onSuccess();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function handleVehicleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setVehicleData((prev) => ({ ...prev, [name]: value }));
    if (vehicleErrors[name]) {
      setVehicleErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && <Alert variant="error">{apiError}</Alert>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre *
          </label>
          <Input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Nombre"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Apellido *
          </label>
          <Input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Apellido"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Telefono *
          </label>
          <Input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Telefono"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.email}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Direccion
          </label>
          <Input
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Direccion"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Notas
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="Notas adicionales..."
          />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFrequent"
              checked={formData.isFrequent}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-600"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Cliente frecuente
            </span>
          </label>
        </div>

        {/* Optional vehicle (only shown on create) */}
        {!isEditMode && (
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addVehicle}
                onChange={(e) => setAddVehicle(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-600"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Agregar vehiculo ahora
              </span>
            </label>

            {addVehicle && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Datos del vehiculo</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Placa *</label>
                    <Input
                      name="plate"
                      value={vehicleData.plate}
                      onChange={handleVehicleChange}
                      placeholder="ABC-123"
                      className="uppercase"
                    />
                    {vehicleErrors.plate && (
                      <p className="mt-1 text-xs text-red-600">{vehicleErrors.plate}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Tipo</label>
                    <Select
                      name="vehicleType"
                      value={vehicleData.vehicleType}
                      onChange={handleVehicleChange}
                    >
                      {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Marca *</label>
                    <Input
                      name="brand"
                      value={vehicleData.brand}
                      onChange={handleVehicleChange}
                      placeholder="Toyota, Chevrolet..."
                    />
                    {vehicleErrors.brand && (
                      <p className="mt-1 text-xs text-red-600">{vehicleErrors.brand}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Modelo *</label>
                    <Input
                      name="model"
                      value={vehicleData.model}
                      onChange={handleVehicleChange}
                      placeholder="Corolla, Spark..."
                    />
                    {vehicleErrors.model && (
                      <p className="mt-1 text-xs text-red-600">{vehicleErrors.model}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Guardando..."
            : isEditMode
            ? "Actualizar Cliente"
            : "Crear Cliente"}
        </Button>
      </div>
    </form>
  );
}
