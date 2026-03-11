"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Plus, Search, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import PageHeader from "@/components/layout/PageHeader";
import { fetchApi } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  isFrequent: boolean;
  _count?: { vehicles: number; orders: number };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterFrequent, setFilterFrequent] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (filterFrequent) params.set("isFrequent", "true");
        const data = await fetchApi<{
          clients: Client[];
          pages?: number;
          totalPages?: number;
        }>(`/api/clients?${params}`);
        if (!cancelled) {
          setClients(data.clients || []);
          setTotalPages(data.pages || data.totalPages || 1);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Error al cargar clientes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [page, debouncedSearch, filterFrequent]);

  return (
    <div>
      <PageHeader title="Clientes" description="Gestión de clientes del autolavado">
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </PageHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, teléfono o email..."
            className="pl-9"
          />
        </div>
        <button
          onClick={() => { setFilterFrequent(!filterFrequent); setPage(1); }}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
            filterFrequent
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          )}
        >
          <Star className={cn("h-3.5 w-3.5", filterFrequent ? "fill-white text-white dark:fill-zinc-900 dark:text-zinc-900" : "text-slate-400")} />
          Frecuentes
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Vehículos</TableHead>
                <TableHead className="hidden md:table-cell">Órdenes</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium text-slate-900">
                      {client.firstName} {client.lastName}
                    </TableCell>
                    <TableCell className="text-slate-600">{client.phone}</TableCell>
                    <TableCell className="hidden text-slate-400 md:table-cell">
                      {client.email || "—"}
                    </TableCell>
                    <TableCell className="hidden text-center md:table-cell">
                      {client._count?.vehicles ?? 0}
                    </TableCell>
                    <TableCell className="hidden text-center md:table-cell">
                      {client._count?.orders ?? 0}
                    </TableCell>
                    <TableCell>
                      {client.isFrequent ? (
                        <Badge variant="success">Frecuente</Badge>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="sm" title="Ver detalle">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
