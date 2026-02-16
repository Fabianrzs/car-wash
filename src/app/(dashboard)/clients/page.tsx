"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Plus, Search } from "lucide-react";
import Button from "@/components/ui/Button";
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
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { fetchApi } from "@/lib/api";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  isFrequent: boolean;
  _count?: {
    vehicles: number;
    orders: number;
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterFrequent, setFilterFrequent] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchClients();
  }, [page, search, filterFrequent]);

  async function fetchClients() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });
      if (search) params.set("search", search);
      if (filterFrequent) params.set("isFrequent", "true");

      const data = await fetchApi<{ clients: Client[]; pages?: number; totalPages?: number }>(`/api/clients?${params}`);
      setClients(data.clients || []);
      setTotalPages(data.pages || data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gestion de clientes del autolavado"
      >
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </PageHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, telefono o email..."
            className="pl-10"
          />
        </div>
        <Button
          variant={filterFrequent ? "primary" : "secondary"}
          onClick={() => {
            setFilterFrequent(!filterFrequent);
            setPage(1);
          }}
        >
          {filterFrequent ? "Mostrando Frecuentes" : "Filtrar Frecuentes"}
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vehiculos</TableHead>
                <TableHead>Ordenes</TableHead>
                <TableHead>Frecuente</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.firstName} {client.lastName}
                    </TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="text-gray-500">
                      {client.email || "-"}
                    </TableCell>
                    <TableCell>{client._count?.vehicles || 0}</TableCell>
                    <TableCell>{client._count?.orders || 0}</TableCell>
                    <TableCell>
                      {client.isFrequent && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Frecuente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-500">
              Pagina {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
