"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import VehicleForm from "@/components/forms/VehicleForm";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { Trash2 } from "lucide-react";

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/vehicles/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setVehicle(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/vehicles/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/vehicles");
    } else {
      const data = await res.json();
      alert(data.error || "Error al eliminar");
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center p-12"><Spinner size="lg" /></div>;
  if (!vehicle) return <div className="p-6 text-center text-gray-500">Vehiculo no encontrado</div>;

  return (
    <div className="p-6">
      <PageHeader title={`${vehicle.plate} - ${vehicle.brand} ${vehicle.model}`} description="Detalle del vehiculo">
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
        </Button>
      </PageHeader>

      <div className="mt-6 max-w-2xl">
        <Card>
          <VehicleForm
            initialData={vehicle}
            defaultClientId={vehicle.clientId}
            onSuccess={() => router.push("/vehicles")}
          />
        </Card>
      </div>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirmar eliminacion">
        <p className="mb-4 text-gray-600">Estas seguro de eliminar el vehiculo <strong>{vehicle.plate}</strong>?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
