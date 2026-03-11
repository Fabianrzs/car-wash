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
import Alert from "@/components/ui/Alert";
import { ArrowLeft, ArrowRight, Check, Search, UserCheck } from "lucide-react";

interface VehicleItem {
  id: string;
  plate: string;
  brand: string;
  model: string;
  vehicleType: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicles: Array<{ vehicle: VehicleItem }>;
}

interface Employee {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string };
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

const STEPS = ["Cliente", "Vehiculo", "Lavador", "Servicios", "Confirmar"];

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

  // Step 3: Employee (lavador)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);

  // Step 4: Services
  const [services, setServices] = useState<ServiceType[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

  // Step 5: Notes + submit
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const debouncedSearch = useDebounce(clientSearch, 300);

  useEffect(() => {
    fetch("/api/services?active=true")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar servicios");
        return r.json();
      })
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Error al cargar servicios"));
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

  // Load employees when reaching step 3
  useEffect(() => {
    if (step !== 3) return;
    setEmployeesLoading(true);
    fetch("/api/tenant/team")
      .then((r) => r.json())
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => setEmployees([]))
      .finally(() => setEmployeesLoading(false));
  }, [step]);

  const selectClient = async (client: Client) => {
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

  const clientVehicles = selectedClient?.vehicles.map((cv) => cv.vehicle) || [];

  const selectedAssignee = employees.find((e) => e.user.id === selectedAssigneeId);

  const handleSubmit = async () => {
    if (!selectedClient || !selectedVehicleId || selectedServices.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          vehicleId: selectedVehicleId,
          assignedToId: selectedAssigneeId || undefined,
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
        setError(data.error || "Error al crear la orden");
        setSubmitting(false);
      }
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Nueva Orden" description={`Paso ${step} de ${STEPS.length}`} />

      {error && <Alert variant="error" className="mt-4">{error}</Alert>}

      <div className="mx-auto mt-6 max-w-3xl">
        {/* Progress bar */}
        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}>
                {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`ml-2 text-sm ${step === i + 1 ? "font-medium text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="mx-4 h-px w-8 bg-slate-300 dark:bg-slate-700" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Client */}
        {step === 1 && (
          <Card>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Seleccionar Cliente</h3>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/50"
                  onClick={() => selectClient(c)}
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{c.firstName} {c.lastName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{c.phone}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
              ))}
              {clients.length === 0 && clientSearch.length >= 3 && !loading && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">No se encontraron clientes</p>
              )}
            </div>
          </Card>
        )}

        {/* Step 2: Select Vehicle */}
        {step === 2 && selectedClient && (
          <Card>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              Seleccionar Vehículo de {selectedClient.firstName} {selectedClient.lastName}
            </h3>
            {clientVehicles.length === 0 ? (
              <div className="text-center">
                <p className="mb-4 text-slate-500 dark:text-slate-400">Este cliente no tiene vehículos registrados</p>
                <Button onClick={() => router.push(`/vehicles/new?clientId=${selectedClient.id}`)}>
                  Registrar Vehiculo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {clientVehicles.map((v) => (
                  <div
                    key={v.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                      selectedVehicleId === v.id ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900/30" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => setSelectedVehicleId(v.id)}
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{v.plate}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {v.brand} {v.model} - {VEHICLE_TYPE_LABELS[v.vehicleType] || v.vehicleType}
                      </p>
                    </div>
                    {selectedVehicleId === v.id && <Check className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />}
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

        {/* Step 3: Select Employee (Lavador) */}
        {step === 3 && (
          <Card>
            <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">Asignar Lavador</h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Opcional — puedes asignarlo después desde el detalle de la orden.</p>

            {employeesLoading ? (
              <div className="flex justify-center py-8"><Spinner size="lg" /></div>
            ) : (
              <div className="space-y-2">
                {/* Sin asignar option */}
                <div
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                    selectedAssigneeId === null ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900/30" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setSelectedAssigneeId(null)}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                    <UserCheck className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Sin asignar</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">La orden quedará pendiente de asignación</p>
                  </div>
                  {selectedAssigneeId === null && <Check className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />}
                </div>

                {employees.map((emp) => (
                  <div
                    key={emp.user.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      selectedAssigneeId === emp.user.id ? "border-zinc-900 bg-zinc-50 dark:bg-zinc-900/10 dark:border-zinc-100" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => setSelectedAssigneeId(emp.user.id)}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {(emp.user.name || emp.user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{emp.user.name || emp.user.email}</p>
                      <p className="text-xs capitalize text-slate-400 dark:text-slate-500">{emp.role.toLowerCase()}</p>
                    </div>
                    {selectedAssigneeId === emp.user.id && <Check className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />}
                  </div>
                ))}

                {employees.length === 0 && (
                  <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">No hay empleados registrados en el equipo</p>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" /> Atras</Button>
              <Button onClick={() => setStep(4)}>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </Card>
        )}

        {/* Step 4: Select Services */}
        {step === 4 && (
          <Card>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Seleccionar Servicios</h3>
            <div className="space-y-2">
              {services.map((svc) => {
                const isSelected = selectedServices.some((s) => s.serviceTypeId === svc.id);
                return (
                  <div
                    key={svc.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                      isSelected ? "border-zinc-900 bg-zinc-50 dark:bg-zinc-900/10 dark:border-zinc-100" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => toggleService(svc)}
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{svc.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{svc.description} - {svc.duration} min</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(svc.price)}</span>
                      {isSelected && <Check className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-400">Servicios seleccionados: {selectedServices.length}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">Total: {formatCurrency(total)}</p>
              </div>
            )}
            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(3)}><ArrowLeft className="mr-2 h-4 w-4" /> Atras</Button>
              <Button disabled={selectedServices.length === 0} onClick={() => setStep(5)}>
                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && selectedClient && (
          <Card>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Confirmar Orden</h3>
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">Cliente</p>
                <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{selectedClient.firstName} {selectedClient.lastName}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">Vehículo</p>
                <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                  {clientVehicles.find((v) => v.id === selectedVehicleId)?.plate} -{" "}
                  {clientVehicles.find((v) => v.id === selectedVehicleId)?.brand}{" "}
                  {clientVehicles.find((v) => v.id === selectedVehicleId)?.model}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">Lavador asignado</p>
                <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                  {selectedAssignee
                    ? (selectedAssignee.user.name || selectedAssignee.user.email)
                    : <span className="text-slate-400 dark:text-slate-500">Sin asignar</span>}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Servicios</p>
                {selectedServices.map((s) => (
                  <div key={s.serviceTypeId} className="flex justify-between py-1 text-sm text-slate-700 dark:text-slate-300">
                    <span>{s.name} x{s.quantity}</span>
                    <span className="font-medium">{formatCurrency(s.price * s.quantity)}</span>
                  </div>
                ))}
                <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-slate-900 dark:text-slate-100">Total</span>
                    <span className="text-slate-900 dark:text-slate-100">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notas (opcional)</label>
                <textarea
                  className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/10"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(4)}><ArrowLeft className="mr-2 h-4 w-4" /> Atras</Button>
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
