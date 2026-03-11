"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import Alert from "@/components/ui/Alert";
import { Play, CheckCircle, XCircle, ArrowLeft, UserCheck } from "lucide-react";

interface TeamMember {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

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
  assignedTo: { id: string; name: string | null } | null;
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
  const { data: session } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const [orderRes, teamRes] = await Promise.all([
          fetch(`/api/orders/${params.id}`),
          fetch("/api/tenant/team"),
        ]);

        if (!orderRes.ok) {
          if (orderRes.status === 404) {
            if (!cancelled) router.replace("/orders");
            return;
          }
          const data = await orderRes.json().catch(() => ({}));
          if (!cancelled) setError(data.error || "Error al cargar la orden");
          return;
        }

        const orderData = await orderRes.json();
        if (!cancelled) setOrder(orderData);

        if (teamRes.ok) {
          const teamData: TeamMember[] = await teamRes.json();
          if (!cancelled) {
            setTeamMembers(teamData);
            if (session?.user?.id) {
              const me = teamData.find((m) => m.user.id === session.user.id);
              setCurrentUserRole(me?.role ?? null);
            }
          }
        }
      } catch {
        if (!cancelled) setError("Error de conexion");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [params.id, session?.user?.id]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al actualizar estado");
      }
    } catch {
      setError("Error de conexion al actualizar estado");
    } finally {
      setUpdating(false);
    }
  };

  const assignOrder = async (assignedToId: string | null) => {
    setAssigning(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${params.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder((prev) => prev ? { ...prev, assignedTo: updated.assignedTo } : prev);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al asignar orden");
      }
    } catch {
      setError("Error de conexion al asignar orden");
    } finally {
      setAssigning(false);
    }
  };

  const badgeVariant = (s: string) =>
    s === "COMPLETED" ? "success" : s === "IN_PROGRESS" ? "info" : s === "CANCELLED" ? "danger" : "warning";

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  if (error && !order) return (
    <div className="p-6">
      <Alert variant="error">{error}</Alert>
    </div>
  );
  if (!order) return <div className="p-6 text-center text-slate-500 dark:text-slate-400">Orden no encontrada</div>;

  const canAssign = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  return (
    <div>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <PageHeader title={`Orden ${order.orderNumber}`}>
        <Button variant="secondary" onClick={() => router.push("/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order Info */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Detalle de la Orden</h3>
              <Badge variant={badgeVariant(order.status)}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cliente</p>
                <p className="mt-0.5 font-medium">
                  <button
                    className="text-violet-600 hover:text-violet-700 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
                    onClick={() => router.push(`/clients/${order.client.id}`)}
                  >
                    {order.client.firstName} {order.client.lastName}
                  </button>
                </p>
                <p className="text-slate-400 dark:text-slate-500">{order.client.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Vehículo</p>
                <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{order.vehicle.plate}</p>
                <p className="text-slate-400 dark:text-slate-500">{order.vehicle.brand} {order.vehicle.model}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Creada por</p>
                <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{order.createdBy?.name || "Sistema"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Fecha de creación</p>
                <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{formatDate(order.createdAt)}</p>
              </div>
              {order.startedAt && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Iniciada</p>
                  <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{formatDate(order.startedAt)}</p>
                </div>
              )}
              {order.completedAt && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Completada</p>
                  <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{formatDate(order.completedAt)}</p>
                </div>
              )}
            </div>

            {order.notes && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">Notas</p>
                <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{order.notes}</p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Servicios</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Duración</TableHead>
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
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div>
          <Card>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Acciones</h3>
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
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
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Esta orden está {ORDER_STATUS_LABELS[order.status].toLowerCase()}.
                  No se pueden realizar más acciones.
                </p>
              )}
            </div>
          </Card>

          {/* Assignment */}
          <Card className="mt-4">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <UserCheck className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Asignado a
            </h3>
            {canAssign ? (
              <select
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-violet-500"
                value={order.assignedTo?.id ?? ""}
                onChange={(e) => assignOrder(e.target.value || null)}
                disabled={assigning}
              >
                <option value="">Sin asignar</option>
                {teamMembers.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name ?? m.user.email} ({m.role === "OWNER" ? "Propietario" : m.role === "ADMIN" ? "Admin" : "Empleado"})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {order.assignedTo?.name ?? <span className="text-slate-400 dark:text-slate-500">Sin asignar</span>}
              </p>
            )}
          </Card>

          {/* Timeline */}
          <Card className="mt-4">
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Historial</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                  <div className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="-mt-0.5">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Orden creada</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              {order.startedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <div className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="-mt-0.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Servicio iniciado</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(order.startedAt)}</p>
                  </div>
                </div>
              )}
              {order.completedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="-mt-0.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Servicio completado</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(order.completedAt)}</p>
                  </div>
                </div>
              )}
              {order.status === "CANCELLED" && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  </div>
                  <div className="-mt-0.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Orden cancelada</p>
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
