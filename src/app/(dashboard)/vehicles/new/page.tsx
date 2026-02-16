"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import VehicleForm from "@/components/forms/VehicleForm";
import Spinner from "@/components/ui/Spinner";

function NewVehicleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") || undefined;

  return (
    <div className="p-6">
      <PageHeader title="Nuevo Vehiculo" description="Registrar un nuevo vehiculo" />
      <div className="mt-6 max-w-2xl">
        <VehicleForm defaultClientId={clientId} onSuccess={() => router.push("/vehicles")} />
      </div>
    </div>
  );
}

export default function NewVehiclePage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Spinner size="lg" /></div>}>
      <NewVehicleContent />
    </Suspense>
  );
}
