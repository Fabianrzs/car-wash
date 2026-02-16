"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { Play, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  client: { id: string; firstName: string; lastName: string; phone: string };
  vehicle: { plate: string; brand: string; model: string };
  createdBy: { name: string };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
    serviceType: { name: string; duration: number };
  }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    const res = await fetch(`/api/orders/${params.id}`);
    if (res.ok) setOrder(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [params.id]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    const res = await fetch(`/api/orders/${params.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      await fetchOrder();
    } else {
      const data = await res.json();
      alert(data.error || "Error al actualizar estado");
    }
    setUpdating(false);
  };

  const badgeVariant = (s: string) =>
    s === "COMPLETED" ? "success" : s === "IN_PROGRESS" ? "info" : s === "CANCELLED" ? "danger" : "warning";

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  if (!order) return <div className="p-6 text-center text-gray-500">Orden no encontrada</div>;

  return (
    <div className="p-6">
      <PageHeader title={`Orden ${order.orderNumber}`}>
        <Button variant="secondary" onClick={() => router.push("/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </PageHeader>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detalle de la Orden</h3>
              <Badge variant={badgeVariant(order.status)}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Cliente</p>
                <p className="font-medium">
                  <button className="text-blue-600 hover:underline" onClick={() => router.push(`/clients/${order.client.id}`)}>
                    {order.client.firstName} {order.client.lastName}
                  </button>
                </p>
                <p className="text-gray-400">{order.client.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Vehiculo</p>
                <p className="font-medium">{order.vehicle.plate}</p>
                <p className="text-gray-400">{order.vehicle.brand} {order.vehicle.model}</p>
              </div>
              <div>
                <p className="text-gray-500">Creada por</p>
                <p className="font-medium">{order.createdBy?.name || "Sistema"}</p>
              </div>
              <div>
                <p className="text-gray-500">Fecha de creacion</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
              {order.startedAt && (
                <div>
                  <p className="text-gray-500">Iniciada</p>
                  <p className="font-medium">{formatDate(order.startedAt)}</p>
                </div>
              )}
              {order.completedAt && (
                <div>
                  <p className="text-gray-500">Completada</p>
                  <p className="font-medium">{formatDate(order.completedAt)}</p>
                </div>
              )}
            </div>

            {order.notes && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <p className="text-sm text-gray-500">Notas</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold">Servicios</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Duracion</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.serviceType.name}</TableCell>
                    <TableCell>{item.serviceType.duration} min</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end border-t pt-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div>
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Acciones</h3>
            <div className="space-y-3">
              {order.status === "PENDING" && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => updateStatus("IN_PROGRESS")}
                    loading={updating}
                  >
                    <Play className="mr-2 h-4 w-4" /> Iniciar Servicio
                  </Button>
                  <Button
                    className="w-full"
                    variant="danger"
                    onClick={() => updateStatus("CANCELLED")}
                    loading={updating}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Cancelar Orden
                  </Button>
                </>
              )}
              {order.status === "IN_PROGRESS" && (
                <>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatus("COMPLETED")}
                    loading={updating}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Completar Servicio
                  </Button>
                  <Button
                    className="w-full"
                    variant="danger"
                    onClick={() => updateStatus("CANCELLED")}
                    loading={updating}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Cancelar Orden
                  </Button>
                </>
              )}
              {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
                <p className="text-center text-sm text-gray-500">
                  Esta orden esta {ORDER_STATUS_LABELS[order.status].toLowerCase()}.
                  No se pueden realizar mas acciones.
                </p>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="mt-4">
            <h3 className="mb-4 text-lg font-semibold">Historial</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <div className="w-px flex-1 bg-gray-200" />
                </div>
                <div>
                  <p className="text-sm font-medium">Orden creada</p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              {order.startedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="w-px flex-1 bg-gray-200" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Servicio iniciado</p>
                    <p className="text-xs text-gray-500">{formatDate(order.startedAt)}</p>
                  </div>
                </div>
              )}
              {order.completedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Servicio completado</p>
                    <p className="text-xs text-gray-500">{formatDate(order.completedAt)}</p>
                  </div>
                </div>
              )}
              {order.status === "CANCELLED" && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Orden cancelada</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
