"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ClientForm from "@/components/forms/ClientForm";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, VEHICLE_TYPE_LABELS } from "@/lib/constants";
import { Trash2, Car } from "lucide-react";

interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  address: string | null;
  notes: string | null;
  isFrequent: boolean;
  vehicles: Array<{
    id: string;
    plate: string;
    brand: string;
    model: string;
    vehicleType: string;
    color: string | null;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: string;
    createdAt: string;
    vehicle: { plate: string };
  }>;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchClient = async () => {
    const res = await fetch(`/api/clients/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setClient(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClient();
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/clients/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/clients");
    } else {
      const data = await res.json();
      alert(data.error || "Error al eliminar");
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center p-12"><Spinner size="lg" /></div>;
  if (!client) return <div className="p-6 text-center text-gray-500">Cliente no encontrado</div>;

  return (
    <div className="p-6">
      <PageHeader
        title={`${client.firstName} ${client.lastName}`}
        description="Detalle y edicion del cliente"
      >
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </Button>
      </PageHeader>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Informacion del Cliente</h3>
            <ClientForm
              initialData={{
                ...client,
                email: client.email || "",
                address: client.address || "",
                notes: client.notes || "",
              }}
              onSuccess={() => fetchClient()}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Vehiculos ({client.vehicles.length})</h3>
              <Button size="sm" onClick={() => router.push(`/vehicles/new?clientId=${client.id}`)}>
                <Car className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>
            {client.vehicles.length === 0 ? (
              <p className="text-sm text-gray-500">Sin vehiculos registrados</p>
            ) : (
              <div className="space-y-2">
                {client.vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                    onClick={() => router.push(`/vehicles/${v.id}`)}
                  >
                    <div>
                      <p className="font-medium">{v.plate}</p>
                      <p className="text-sm text-gray-500">{v.brand} {v.model} - {VEHICLE_TYPE_LABELS[v.vehicleType] || v.vehicleType}</p>
                    </div>
                    {v.color && <span className="text-sm text-gray-400">{v.color}</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold">Ultimas Ordenes</h3>
            {client.orders.length === 0 ? (
              <p className="text-sm text-gray-500">Sin ordenes registradas</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead># Orden</TableHead>
                    <TableHead>Vehiculo</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => router.push(`/orders/${o.id}`)}
                        >
                          {o.orderNumber}
                        </button>
                      </TableCell>
                      <TableCell>{o.vehicle.plate}</TableCell>
                      <TableCell>{formatCurrency(o.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          o.status === "COMPLETED" ? "success" :
                          o.status === "IN_PROGRESS" ? "info" :
                          o.status === "CANCELLED" ? "danger" : "warning"
                        }>
                          {ORDER_STATUS_LABELS[o.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirmar eliminacion">
        <p className="mb-4 text-gray-600">
          Estas seguro de eliminar al cliente <strong>{client.firstName} {client.lastName}</strong>?
          Esta accion no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
