"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import { VEHICLE_TYPE_LABELS } from "@/lib/utils/constants";
import { X } from "lucide-react";

interface VehicleFormData {
  id?: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  vehicleType: string;
  clientIds: string[];
}

interface ClientOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface VehicleFormProps {
  initialData?: VehicleFormData;
  defaultClientIds?: string[];
  onSuccess: () => void;
}

export default function VehicleForm({
  initialData,
  defaultClientIds,
  onSuccess,
}: VehicleFormProps) {
  const [formData, setFormData] = useState<Omit<VehicleFormData, "clientIds">>({
    plate: initialData?.plate || "",
    brand: initialData?.brand || "",
    model: initialData?.model || "",
    year: initialData?.year || "",
    color: initialData?.color || "",
    vehicleType: initialData?.vehicleType || "SEDAN",
  });
  const [selectedClients, setSelectedClients] = useState<ClientOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [searchResults, setSearchResults] = useState<ClientOption[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Inline new client form
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: "", lastName: "", phone: "" });
  const [newClientErrors, setNewClientErrors] = useState<Record<string, string>>({});
  const [creatingClient, setCreatingClient] = useState(false);

  const isEditMode = !!initialData?.id;

  // Initialize selected clients from initialData or defaultClientIds
  useEffect(() => {
    const ids = initialData?.clientIds || defaultClientIds || [];
    if (ids.length === 0) return;

    Promise.all(
      ids.map((id) =>
        fetch(`/api/clients/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      const clients = results.filter(Boolean) as ClientOption[];
      setSelectedClients(clients);
    });
  }, []);

  // Search clients debounced
  useEffect(() => {
    if (clientSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/clients?search=${encodeURIComponent(clientSearch)}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          const all: ClientOption[] = data.clients || data;
          // Filter already selected
          const selectedIds = new Set(selectedClients.map((c) => c.id));
          setSearchResults(all.filter((c) => !selectedIds.has(c.id)));
        }
      } catch {
        // Silently handle
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearch, selectedClients]);

  function addClient(client: ClientOption) {
    setSelectedClients((prev) => [...prev, client]);
    setClientSearch("");
    setShowDropdown(false);
    setSearchResults([]);
    if (errors.clientIds) {
      setErrors((prev) => { const n = { ...prev }; delete n.clientIds; return n; });
    }
  }

  function removeClient(id: string) {
    setSelectedClients((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleCreateNewClient() {
    const errs: Record<string, string> = {};
    if (!newClient.firstName.trim()) errs.firstName = "Requerido";
    if (!newClient.lastName.trim()) errs.lastName = "Requerido";
    if (!newClient.phone.trim() || newClient.phone.trim().length < 7) errs.phone = "Telefono invalido";
    if (Object.keys(errs).length > 0) { setNewClientErrors(errs); return; }

    setCreatingClient(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newClient, isFrequent: false }),
      });
      if (!res.ok) {
        const data = await res.json();
        setNewClientErrors({ phone: data.error || "Error al crear cliente" });
        return;
      }
      const created: ClientOption = await res.json();
      addClient(created);
      setNewClient({ firstName: "", lastName: "", phone: "" });
      setNewClientErrors({});
      setShowNewClient(false);
    } catch {
      setNewClientErrors({ phone: "Error de conexion" });
    } finally {
      setCreatingClient(false);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.plate.trim()) newErrors.plate = "La placa es requerida";
    if (!formData.brand.trim()) newErrors.brand = "La marca es requerida";
    if (!formData.model.trim()) newErrors.model = "El modelo es requerido";
    if (selectedClients.length === 0) newErrors.clientIds = "Debe seleccionar al menos un cliente";
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
        clientIds: selectedClients.map((c) => c.id),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && <Alert variant="error">{apiError}</Alert>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.plate}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Marca *
          </label>
          <Input
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="Toyota, Chevrolet..."
          />
          {errors.brand && (
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.brand}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Modelo *
          </label>
          <Input
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="Corolla, Spark..."
          />
          {errors.model && (
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.model}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.year}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Color
          </label>
          <Input
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="Blanco, Negro..."
          />
        </div>

        {/* Clients section */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Clientes *
          </label>

          {/* Selected client chips */}
          {selectedClients.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedClients.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {c.firstName} {c.lastName}
                  <button
                    type="button"
                    onClick={() => removeClient(c.id)}
                    className="ml-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Input
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar cliente por nombre o telefono..."
            />
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {searchResults.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => addClient(client)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {client.firstName} {client.lastName} — {client.phone}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create new client inline */}
          <div className="mt-2">
            {!showNewClient ? (
              <button
                type="button"
                onClick={() => setShowNewClient(true)}
                className="text-sm text-slate-600 underline-offset-2 hover:underline dark:text-slate-400"
              >
                + Crear nuevo cliente
              </button>
            ) : (
              <div className="mt-2 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nuevo cliente</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Input
                      placeholder="Nombre *"
                      value={newClient.firstName}
                      onChange={(e) => setNewClient((p) => ({ ...p, firstName: e.target.value }))}
                    />
                    {newClientErrors.firstName && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{newClientErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      placeholder="Apellido *"
                      value={newClient.lastName}
                      onChange={(e) => setNewClient((p) => ({ ...p, lastName: e.target.value }))}
                    />
                    {newClientErrors.lastName && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{newClientErrors.lastName}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      placeholder="Telefono *"
                      value={newClient.phone}
                      onChange={(e) => setNewClient((p) => ({ ...p, phone: e.target.value }))}
                    />
                    {newClientErrors.phone && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{newClientErrors.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateNewClient}
                    disabled={creatingClient}
                  >
                    {creatingClient ? "Guardando..." : "Guardar cliente"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowNewClient(false);
                      setNewClient({ firstName: "", lastName: "", phone: "" });
                      setNewClientErrors({});
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {errors.clientIds && (
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.clientIds}</p>
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
