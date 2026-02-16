"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, CreditCard, ShieldOff, Clock } from "lucide-react";

interface PlanStatus {
  isBlocked: boolean;
  reason: "no_plan" | "trial_expired" | "inactive" | "payment_overdue" | null;
  trialEndsAt: string | null;
  planName: string | null;
  daysLeft: number | null;
  pendingInvoiceId: string | null;
}

const EXEMPT_PATHS = ["/billing", "/settings"];

const BLOCK_CONFIG: Record<string, {
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  showButton: boolean;
  buttonLabel: string;
  buttonPath: string;
}> = {
  no_plan: {
    icon: CreditCard,
    title: "No tienes un plan activo",
    description: "Necesitas seleccionar un plan para poder usar todas las funciones del sistema.",
    showButton: true,
    buttonLabel: "Seleccionar Plan",
    buttonPath: "/billing",
  },
  trial_expired: {
    icon: AlertTriangle,
    title: "Tu periodo de servicio ha expirado",
    description: "Tu periodo de servicio ha finalizado. Renueva tu plan para continuar usando el sistema.",
    showButton: true,
    buttonLabel: "Renovar Plan",
    buttonPath: "/billing",
  },
  payment_overdue: {
    icon: Clock,
    title: "Tienes un pago pendiente",
    description: "Tienes una factura pendiente de pago. Realiza el pago para continuar usando el sistema.",
    showButton: true,
    buttonLabel: "Pagar Ahora",
    buttonPath: "/billing",
  },
  inactive: {
    icon: ShieldOff,
    title: "Tu cuenta esta inactiva",
    description: "Tu cuenta ha sido desactivada. Contacta al administrador para reactivarla.",
    showButton: false,
    buttonLabel: "",
    buttonPath: "",
  },
};

export default function PlanBlockingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);

  useEffect(() => {
    fetch("/api/tenant/plan-status")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(setPlanStatus)
      .catch(() => {
        // Fail-open: don't block on network errors
        setPlanStatus({ isBlocked: false, reason: null, trialEndsAt: null, planName: null, daysLeft: null, pendingInvoiceId: null });
      });
  }, [pathname]);

  // Don't block exempt paths
  const isExempt = EXEMPT_PATHS.some((p) => pathname.startsWith(p));

  // Show expiration warning banner (not blocking)
  const showWarning =
    planStatus &&
    !planStatus.isBlocked &&
    planStatus.daysLeft !== null &&
    planStatus.daysLeft > 0 &&
    planStatus.daysLeft <= 7 &&
    !isExempt;

  if (!planStatus) {
    return <>{children}</>;
  }

  // Not blocked - show children (with optional warning)
  if (!planStatus.isBlocked || isExempt) {
    return (
      <>
        {showWarning && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <Clock className="h-5 w-5 shrink-0 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Tu plan vence en {planStatus.daysLeft} dia{planStatus.daysLeft !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-yellow-600">
                Renueva tu suscripcion para no perder acceso.
              </p>
            </div>
            <button
              onClick={() => router.push("/billing")}
              className="rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700"
            >
              Renovar
            </button>
          </div>
        )}
        {children}
      </>
    );
  }

  const config = BLOCK_CONFIG[planStatus.reason!] || BLOCK_CONFIG.no_plan;
  const Icon = config.icon;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Icon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">{config.title}</h2>
          <p className="mb-6 text-sm text-gray-600">{config.description}</p>
          {config.showButton && (
            <button
              onClick={() => {
                const path = planStatus.pendingInvoiceId
                  ? `/billing/invoices/${planStatus.pendingInvoiceId}`
                  : config.buttonPath;
                router.push(path);
              }}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {config.buttonLabel}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
