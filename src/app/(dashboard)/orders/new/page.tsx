"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";
import { ArrowLeft, ArrowRight, Check, Search } from "lucide-react";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicles: Array<{ id: string; plate: string; brand: string; model: string; vehicleType: string }>;
}

interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  price: string;
  duration: number;
}

interface SelectedService {
  serviceTypeId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Client
  const [clientSearch, setClientSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Step 2: Vehicle
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  // Step 3: Services
  const [services, setServices] = useState<ServiceType[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

  // Step 4: Notes
  const [notes, setNotes] = useState("");

  const debouncedSearch = useDebounce(clientSearch, 300);

  useEffect(() => {
    fetch("/api/services?active=true")
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (debouncedSearch.trim().length < 3) {
      setClients([]);
      return;
    }
    setLoading(true);
    fetch(`/api/clients?search=${encodeURIComponent(debouncedSearch)}&page=1`)
      .then((r) => r.json())
      .then((data) => {
        setClients(data.clients || []);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  const selectClient = async (client: Client) => {
    // Fetch client with vehicles
    const res = await fetch(`/api/clients/${client.id}`);
    const data = await res.json();
    setSelectedClient(data);
    setStep(2);
  };

  const toggleService = (svc: ServiceType) => {
    const exists = selectedServices.find((s) => s.serviceTypeId === svc.id);
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.serviceTypeId !== svc.id));
    } else {
      setSelectedServices([...selectedServices, {
        serviceTypeId: svc.id,
        name: svc.name,
        price: Number(svc.price),
        quantity: 1,
      }]);
    }
  };

  const total = selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0);

  const handleSubmit = async () => {
    if (!selectedClient || !selectedVehicleId || selectedServices.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          vehicleId: selectedVehicleId,
          notes: notes || undefined,
          items: selectedServices.map((s) => ({
            serviceTypeId: s.serviceTypeId,
            quantity: s.quantity,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/orders/${data.id}`);
      } else {
        const data = await res.json();
        alert(data.error || "Error al crear la orden");
        setSubmitting(false);
      }
    } catch {
      alert("Error de conexion. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <PageHeader title="Nueva Orden" description={`Paso ${step} de 4`} />

      <div className="mx-auto mt-6 max-w-3xl">
        {/* Progress bar */}
        <div className="mb-8 flex items-center justify-between">
          {["Cliente", "Vehiculo", "Servicios", "Confirmar"].map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`ml-2 text-sm ${step === i + 1 ? "font-medium" : "text-gray-500"}`}>{label}</span>
              {i < 3 && <div className="mx-4 h-px w-12 bg-gray-300" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Client */}
        {step === 1 && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Seleccionar Cliente</h3>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Escribe al menos 3 letras para buscar..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {loading && <div className="mt-2 flex justify-center"><Spinner size="sm" /></div>}
            </div>
            <div className="space-y-2">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-blue-50"
                  onClick={() => selectClient(c)}
                >
                  <div>
                    <p className="font-medium">{c.firstName} {c.lastName}</p>
                    <p className="text-sm text-gray-500">{c.phone}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
              {clients.length === 0 && clientSearch.length >= 3 && !loading && (
                <p className="text-center text-sm text-gray-500">No se encontraron clientes</p>
              )}
            </div>
          </Card>
        )}

        {/* Step 2: Select Vehicle */}
        {step === 2 && selectedClient && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold">
              Seleccionar Vehiculo de {selectedClient.firstName} {selectedClient.lastName}
            </h3>
            {selectedClient.vehicles.length === 0 ? (
              <div className="text-center">
                <p className="mb-4 text-gray-500">Este cliente no tiene vehiculos registrados</p>
                <Button onClick={() => router.push(`/vehicles/new?clientId=${selectedClient.id}`)}>
                  Registrar Vehiculo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedClient.vehicles.map((v) => (
                  <div
                    key={v.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                      selectedVehicleId === v.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedVehicleId(v.id)}
                  >
                    <div>
                      <p className="font-medium">{v.plate}</p>
                      <p className="text-sm text-gray-500">
                        {v.brand} {v.model} - {VEHICLE_TYPE_LABELS[v.vehicleType] || v.vehicleType}
                      </p>
                    </div>
                    {selectedVehicleId === v.id && <Check className="h-5 w-5 text-blue-600" />}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Atras</Button>
              <Button disabled={!selectedVehicleId} onClick={() => setStep(3)}>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </Card>
        )}

        {/* Step 3: Select Services */}
        {step === 3 && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Seleccionar Servicios</h3>
            <div className="space-y-2">
              {services.map((svc) => {
                const isSelected = selectedServices.some((s) => s.serviceTypeId === svc.id);
                return (
                  <div
                    key={svc.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                      isSelected ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => toggleService(svc)}
                  >
                    <div>
                      <p className="font-medium">{svc.name}</p>
                      <p className="text-sm text-gray-500">{svc.description} - {svc.duration} min</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-blue-600">{formatCurrency(svc.price)}</span>
                      {isSelected && <Check className="h-5 w-5 text-blue-600" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Servicios seleccionados: {selectedServices.length}</p>
                <p className="text-xl font-bold">Total: {formatCurrency(total)}</p>
              </div>
            )}
            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" /> Atras</Button>
              <Button disabled={selectedServices.length === 0} onClick={() => setStep(4)}>
                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && selectedClient && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Confirmar Orden</h3>
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Vehiculo</p>
                <p className="font-medium">
                  {selectedClient.vehicles.find((v) => v.id === selectedVehicleId)?.plate} -{" "}
                  {selectedClient.vehicles.find((v) => v.id === selectedVehicleId)?.brand}{" "}
                  {selectedClient.vehicles.find((v) => v.id === selectedVehicleId)?.model}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="mb-2 text-sm text-gray-500">Servicios</p>
                {selectedServices.map((s) => (
                  <div key={s.serviceTypeId} className="flex justify-between py-1">
                    <span>{s.name} x{s.quantity}</span>
                    <span className="font-medium">{formatCurrency(s.price * s.quantity)}</span>
                  </div>
                ))}
                <div className="mt-2 border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notas (opcional)</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(3)}><ArrowLeft className="mr-2 h-4 w-4" /> Atras</Button>
              <Button onClick={handleSubmit} loading={submitting}>
                <Check className="mr-2 h-4 w-4" /> Crear Orden
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
