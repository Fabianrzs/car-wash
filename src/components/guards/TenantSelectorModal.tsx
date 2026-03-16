"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getSelectedTenant,
  setSelectedTenant as saveTenantCookie,
} from "@/lib/multitenancy/cookie";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { Search, Building2, Shield } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface TenantGuardProps {
  children: React.ReactNode;
}

export default function TenantGuard({ children }: TenantGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const isSuperAdmin = session?.user?.globalRole === "SUPER_ADMIN";

  // Fetch tenants for SUPER_ADMIN (from admin list)
  const fetchAdminTenants = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/admin/tenants/list${params}`);
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants ?? []);
      }
    } catch {
      setError("No se pudieron cargar los lavaderos.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tenants for regular multi-tenant users
  const fetchUserTenants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/tenants");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list: Tenant[] = data.tenants ?? [];

      if (list.length === 0) {
        router.replace("/login");
        return;
      }
      if (list.length === 1) {
        // Auto-select the only tenant
        saveTenantCookie(list[0].slug);
        setReady(true);
      } else {
        setTenants(list);
        setShowSelector(true);
      }
    } catch {
      setError("No se pudieron cargar los lavaderos.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Resolve tenant on session load
  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;

    // Already have a cookie → tenant confirmed
    if (getSelectedTenant()) {
      setReady(true);
      return;
    }

    if (isSuperAdmin) {
      setShowSelector(true);
      return;
    }

    // Regular user: single tenant embedded in JWT → auto-set cookie
    if (session.user.tenantSlug) {
      saveTenantCookie(session.user.tenantSlug);
      setReady(true);
      return;
    }

    // Regular user: no JWT tenantSlug → multi-tenant, must select
    fetchUserTenants();
  }, [session, status, isSuperAdmin, fetchUserTenants]);

  // Fetch admin tenants when selector opens or search changes
  useEffect(() => {
    if (showSelector && isSuperAdmin) {
      fetchAdminTenants(debouncedSearch);
    }
  }, [showSelector, debouncedSearch, isSuperAdmin, fetchAdminTenants]);

  const handleConfirm = () => {
    if (!selected) return;
    saveTenantCookie(selected.slug);
    window.location.reload();
  };

  // Block until tenant is ready
  if (status === "loading" || (!ready && !showSelector && !error)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !showSelector) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      {ready && children}

      <Modal isOpen={showSelector} onClose={() => {}} title="Seleccionar Lavadero">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Selecciona el lavadero que deseas gestionar.
          </p>

          {/* Search — only for SUPER_ADMIN */}
          {isSuperAdmin && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nombre o slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/10"
              />
            </div>
          )}

          {/* Tenant list */}
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : error ? (
              <p className="py-8 text-center text-sm text-rose-500 dark:text-rose-400">{error}</p>
            ) : tenants.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No se encontraron lavaderos
              </p>
            ) : (
              tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => setSelected(tenant)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    selected?.id === tenant.id
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                  }`}
                >
                  <Building2 className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{tenant.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{tenant.slug}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Shield className="h-4 w-4" />
                Ir al Panel Admin
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selected}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
