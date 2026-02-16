"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";

interface BillingData {
  plan: {
    id: string;
    name: string;
    price: number;
    interval: string;
    maxUsers: number;
    maxOrdersPerMonth: number;
  } | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/billing")
      .then((res) => res.json())
      .then(setBilling)
      .finally(() => setLoading(false));
  }, []);

  const handleManageBilling = async () => {
    const res = await fetch("/api/tenant/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "portal" }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">Facturacion</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {billing?.plan ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Plan: {billing.plan.name}
            </h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              ${Number(billing.plan.price).toLocaleString("es-CO")}
              <span className="text-sm font-normal text-gray-500">
                /{billing.plan.interval === "MONTHLY" ? "mes" : "ano"}
              </span>
            </p>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p>Hasta {billing.plan.maxUsers} usuarios</p>
              <p>Hasta {billing.plan.maxOrdersPerMonth} ordenes/mes</p>
            </div>

            {billing.stripeCustomerId && (
              <button
                onClick={handleManageBilling}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Administrar Suscripcion
              </button>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <CreditCard className="mx-auto mb-2 h-8 w-8" />
            <p>No tienes un plan activo</p>
            <p className="text-sm">Contacta al administrador para activar un plan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
