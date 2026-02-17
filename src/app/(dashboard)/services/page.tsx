"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import { formatCurrency } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { Plus, Clock, Pencil } from "lucide-react";

interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  price: string;
  duration: number;
  isActive: boolean;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApi<ServiceType[]>("/api/services")
      .then((data) => setServices(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div>
      <PageHeader title="Servicios" description="Tipos de servicio de lavado disponibles">
        <Button onClick={() => router.push("/services/new")}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
        </Button>
      </PageHeader>

      {error && <Alert variant="error" className="mt-4">{error}</Alert>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Card key={s.id} className={`cursor-pointer transition-shadow hover:shadow-md ${!s.isActive ? "opacity-60" : ""}`}>
            <div onClick={() => router.push(`/services/${s.id}`)}>
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-lg font-semibold">{s.name}</h3>
                <Badge variant={s.isActive ? "success" : "default"}>
                  {s.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="mb-3 text-sm text-gray-500">{s.description || "Sin descripcion"}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(s.price)}</span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" /> {s.duration} min
                </span>
              </div>
            </div>
          </Card>
        ))}
        {services.length === 0 && (
          <p className="col-span-full text-center text-gray-500">No hay servicios registrados</p>
        )}
      </div>
    </div>
  );
}
