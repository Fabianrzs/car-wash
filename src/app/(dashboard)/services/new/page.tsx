"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ServiceTypeForm from "@/components/forms/ServiceTypeForm";

export default function NewServicePage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <PageHeader title="Nuevo Servicio" description="Crear un nuevo tipo de servicio" />
      <div className="mt-6 max-w-2xl">
        <ServiceTypeForm onSuccess={() => router.push("/services")} />
      </div>
    </div>
  );
}
