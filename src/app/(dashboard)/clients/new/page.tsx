"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ClientForm from "@/components/forms/ClientForm";

export default function NewClientPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <PageHeader
        title="Nuevo Cliente"
        description="Registrar un nuevo cliente en el sistema"
      />
      <div className="mt-6 max-w-2xl">
        <ClientForm onSuccess={() => router.push("/clients")} />
      </div>
    </div>
  );
}
