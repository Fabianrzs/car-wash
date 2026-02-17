"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { buildTenantUrl, extractTenantSlugFromHost } from "@/lib/domain";
import Modal from "@/components/ui/Modal";
import { Search, Building2, Shield } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function TenantSelectorModal() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const isSuperAdmin = session?.user?.globalRole === "SUPER_ADMIN";

  const fetchTenants = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/admin/tenants/list${params}`);
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Show modal only for SUPER_ADMIN without a tenant subdomain
  useEffect(() => {
    if (!isSuperAdmin) return;
    const currentSlug = extractTenantSlugFromHost(window.location.host);
    if (!currentSlug) {
      setIsOpen(true);
    }
  }, [isSuperAdmin]);

  // Fetch tenants on open and on search change
  useEffect(() => {
    if (isOpen) {
      fetchTenants(debouncedSearch);
    }
  }, [isOpen, debouncedSearch, fetchTenants]);

  if (!isSuperAdmin) return null;

  const handleConfirm = () => {
    if (!selectedTenant) return;
    const tenantUrl = buildTenantUrl(selectedTenant.slug, window.location.pathname);
    // Redirect via session-relay to set auth cookie on the tenant subdomain
    window.location.href = `/api/auth/session-relay?callbackUrl=${encodeURIComponent(tenantUrl)}`;
  };

  const handleGoToAdmin = () => {
    router.push("/admin");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Seleccionar Lavadero"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Selecciona el lavadero que deseas gestionar.
        </p>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Tenant list */}
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Cargando...
            </div>
          ) : tenants.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No se encontraron lavaderos
            </div>
          ) : (
            tenants.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => setSelectedTenant(tenant)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                  selectedTenant?.id === tenant.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Building2 className="h-5 w-5 shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{tenant.name}</p>
                  <p className="truncate text-xs text-gray-500">{tenant.slug}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={handleGoToAdmin}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Shield className="h-4 w-4" />
            Ir al Panel Admin
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedTenant}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  );
}
