"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";

interface VehicleFormData {
  id?: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  vehicleType: string;
  clientId: string;
}

interface ClientOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface VehicleFormProps {
  initialData?: VehicleFormData;
  defaultClientId?: string;
  onSuccess: () => void;
}

export default function VehicleForm({
  initialData,
  defaultClientId,
  onSuccess,
}: VehicleFormProps) {
  const [formData, setFormData] = useState<VehicleFormData>({
    plate: initialData?.plate || "",
    brand: initialData?.brand || "",
    model: initialData?.model || "",
    year: initialData?.year || "",
    color: initialData?.color || "",
    vehicleType: initialData?.vehicleType || "SEDAN",
    clientId: initialData?.clientId || defaultClientId || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState("");

  const isEditMode = !!initialData?.id;

  useEffect(() => {
    const cId = initialData?.clientId || defaultClientId;
    if (cId) {
      fetchClientName(cId);
    }
  }, [initialData?.clientId, defaultClientId]);

  async function fetchClientName(clientId: string) {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (res.ok) {
        const client = await res.json();
        setSelectedClientName(
          `${client.firstName} ${client.lastName} - ${client.phone}`
        );
      }
    } catch {
      // Silently handle
    }
  }

  useEffect(() => {
    if (clientSearch.length < 2) {
      setClients([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/clients?search=${encodeURIComponent(clientSearch)}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || data);
        }
      } catch {
        // Silently handle
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearch]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.plate.trim()) {
      newErrors.plate = "La placa es requerida";
    }
    if (!formData.brand.trim()) {
      newErrors.brand = "La marca es requerida";
    }
    if (!formData.model.trim()) {
      newErrors.model = "El modelo es requerido";
    }
    if (!formData.clientId) {
      newErrors.clientId = "Debe seleccionar un cliente";
    }
    if (formData.year && (isNaN(Number(formData.year)) || Number(formData.year) < 1900)) {
      newErrors.year = "El ano debe ser valido";
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
        ? `/api/vehicles/${initialData!.id}`
        : "/api/vehicles";
      const method = isEditMode ? "PUT" : "POST";

      const payload = {
        ...formData,
        year: formData.year ? Number(formData.year) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar el vehiculo");
      }

      onSuccess();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function selectClient(client: ClientOption) {
    setFormData((prev) => ({ ...prev, clientId: client.id }));
    setSelectedClientName(
      `${client.firstName} ${client.lastName} - ${client.phone}`
    );
    setClientSearch("");
    setShowClientDropdown(false);
    if (errors.clientId) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.clientId;
        return next;
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && <Alert variant="error">{apiError}</Alert>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Placa *
          </label>
          <Input
            name="plate"
            value={formData.plate}
            onChange={handleChange}
            placeholder="ABC-123"
            className="uppercase"
          />
          {errors.plate && (
            <p className="mt-1 text-sm text-red-600">{errors.plate}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tipo de Vehiculo
          </label>
          <Select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
          >
            {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Marca *
          </label>
          <Input
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="Toyota, Chevrolet..."
          />
          {errors.brand && (
            <p className="mt-1 text-sm text-red-600">{errors.brand}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Modelo *
          </label>
          <Input
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="Corolla, Spark..."
          />
          {errors.model && (
            <p className="mt-1 text-sm text-red-600">{errors.model}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ano
          </label>
          <Input
            name="year"
            type="number"
            value={formData.year}
            onChange={handleChange}
            placeholder="2024"
          />
          {errors.year && (
            <p className="mt-1 text-sm text-red-600">{errors.year}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Color
          </label>
          <Input
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="Blanco, Negro..."
          />
        </div>

        <div className="relative sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Cliente *
          </label>
          {selectedClientName && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <span>{selectedClientName}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedClientName("");
                  setFormData((prev) => ({ ...prev, clientId: "" }));
                }}
                className="ml-auto text-blue-600 hover:text-blue-800"
              >
                Cambiar
              </button>
            </div>
          )}
          {!selectedClientName && (
            <>
              <Input
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Buscar cliente por nombre o telefono..."
              />
              {showClientDropdown && clients.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => selectClient(client)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {client.firstName} {client.lastName} - {client.phone}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {errors.clientId && (
            <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
          )}
        </div>
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
            ? "Actualizar Vehiculo"
            : "Crear Vehiculo"}
        </Button>
      </div>
    </form>
  );
}
