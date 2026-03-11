"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, CreditCard, ShieldOff, Clock } from "lucide-react";

const CACHE_TTL_MS = 60_000;

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
    title: "Tu período de servicio expiró",
    description: "Tu período de servicio ha finalizado. Renueva tu plan para continuar.",
    showButton: true,
    buttonLabel: "Renovar Plan",
    buttonPath: "/billing",
  },
  payment_overdue: {
    icon: Clock,
    title: "Tienes un pago pendiente",
    description: "Hay una factura pendiente. Realiza el pago para continuar usando el sistema.",
    showButton: true,
    buttonLabel: "Pagar Ahora",
    buttonPath: "/billing",
  },
  inactive: {
    icon: ShieldOff,
    title: "Tu cuenta está inactiva",
    description: "Tu cuenta ha sido desactivada. Contacta al administrador para reactivarla.",
    showButton: false,
    buttonLabel: "",
    buttonPath: "",
  },
};

let cachedStatus: PlanStatus | null = null;
let cacheExpiresAt = 0;

export default function PlanBlockingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(cachedStatus);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    if (cachedStatus && now < cacheExpiresAt) {
      setPlanStatus(cachedStatus);
      return;
    }
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    fetch("/api/tenant/plan-status")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((status: PlanStatus) => {
        cachedStatus = status;
        cacheExpiresAt = Date.now() + CACHE_TTL_MS;
        setPlanStatus(status);
      })
      .catch(() => {
        const fallback: PlanStatus = {
          isBlocked: false, reason: null, trialEndsAt: null,
          planName: null, daysLeft: null, pendingInvoiceId: null,
        };
        cachedStatus = fallback;
        cacheExpiresAt = Date.now() + CACHE_TTL_MS;
        setPlanStatus(fallback);
      })
      .finally(() => { fetchingRef.current = false; });
  }, [pathname]);

  const isExempt = EXEMPT_PATHS.some((p) => pathname.startsWith(p));

  const showWarning =
    planStatus &&
    !planStatus.isBlocked &&
    planStatus.daysLeft !== null &&
    planStatus.daysLeft > 0 &&
    planStatus.daysLeft <= 7 &&
    !isExempt;

  if (!planStatus) return <>{children}</>;

  if (!planStatus.isBlocked || isExempt) {
    return (
      <>
        {showWarning && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Tu plan vence en {planStatus.daysLeft} día{planStatus.daysLeft !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Renueva tu suscripción para no perder acceso.
              </p>
            </div>
            <button
              onClick={() => router.push("/billing")}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm dark:bg-slate-950/70">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-900/20 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20">
          <Icon className="h-7 w-7 text-rose-600 dark:text-rose-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{config.title}</h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{config.description}</p>
        {config.showButton && (
          <button
            onClick={() => {
              const path = planStatus.pendingInvoiceId
                ? `/billing/invoices/${planStatus.pendingInvoiceId}`
                : config.buttonPath;
              router.push(path);
            }}
            className="w-full rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 active:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {config.buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
}
