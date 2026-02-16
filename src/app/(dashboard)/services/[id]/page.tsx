"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ServiceTypeForm from "@/components/forms/ServiceTypeForm";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { Trash2 } from "lucide-react";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/services/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setService(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/services/${params.id}`, { method: "DELETE" });
    if (res.ok) router.push("/services");
    else {
      alert("Error al desactivar servicio");
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  if (!service) return <div className="p-6 text-center text-gray-500">Servicio no encontrado</div>;

  return (
    <div className="p-6">
      <PageHeader title={`Editar: ${service.name}`} description="Modificar tipo de servicio">
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Desactivar
        </Button>
      </PageHeader>

      <div className="mt-6 max-w-2xl">
        <Card>
          <ServiceTypeForm
            initialData={{ ...service, price: Number(service.price) }}
            onSuccess={() => router.push("/services")}
          />
        </Card>
      </div>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Desactivar servicio">
        <p className="mb-4 text-gray-600">
          El servicio <strong>{service.name}</strong> sera desactivado y no aparecera al crear nuevas ordenes.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>Desactivar</Button>
        </div>
      </Modal>
    </div>
  );
}
