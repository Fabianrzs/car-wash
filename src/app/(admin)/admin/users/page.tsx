"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  globalRole: string;
  createdAt: string;
  tenantUsers: {
    role: string;
    tenant: { id: string; name: string; slug: string };
  }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedSearch) params.set("search", debouncedSearch);

    fetch(`/api/admin/users?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  return (
    <div>
      <OnboardingTour flowKey="admin-users" />
      <h1 className="mb-6 text-xl font-bold text-slate-900 dark:text-slate-100 md:text-2xl">
        Usuarios ({total})
      </h1>

      <div data-onboarding="admin-users-search" className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/10"
          />
        </div>
      </div>

      <div data-onboarding="admin-users-table" className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol Global</th>
              <th className="px-4 py-3 font-medium">Tenants</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Cargando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No hay usuarios
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{u.name || "—"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.globalRole === "SUPER_ADMIN"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {u.globalRole}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.tenantUsers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.tenantUsers.map((tu, i) => (
                          <span key={i} className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {tu.tenant.name} ({tu.role})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">Ninguno</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString("es-CO")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={pages} onPageChange={setPage} />
    </div>
  );
}
