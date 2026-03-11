"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import { Plus, Eye, Search } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  vehicleType: string;
  clients: Array<{
    clientId: string;
    client: { id: string; firstName: string; lastName: string };
  }>;
}

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      const data = await fetchApi<{ vehicles: Vehicle[]; pages: number }>(
        `/api/vehicles?${params}`
      );
      setVehicles(data.vehicles || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, [page, search]);

  return (
    <div>
      <PageHeader title="Vehículos" description="Gestión de vehículos registrados">
        <Button onClick={() => router.push("/vehicles/new")}>
          <Plus className="h-4 w-4" />
          Nuevo Vehículo
        </Button>
      </PageHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="mb-4 relative w-full md:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por placa..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Color</TableHead>
                <TableHead className="hidden md:table-cell">Clientes</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-slate-400"
                  >
                    No se encontraron vehículos
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium text-slate-900">
                      {v.plate}
                    </TableCell>
                    <TableCell className="text-slate-700">{v.brand}</TableCell>
                    <TableCell className="text-slate-700">{v.model}</TableCell>
                    <TableCell className="hidden text-slate-500 md:table-cell">
                      {VEHICLE_TYPE_LABELS[v.vehicleType] || v.vehicleType}
                    </TableCell>
                    <TableCell className="hidden text-slate-500 md:table-cell">
                      {v.color || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {v.clients.length === 0 ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <div className="space-y-0.5">
                          {v.clients.slice(0, 2).map((cv) => (
                            <button
                              key={cv.client.id}
                              className="block text-xs text-slate-600 underline-offset-2 hover:underline dark:text-slate-400"
                              onClick={() => router.push(`/clients/${cv.client.id}`)}
                            >
                              {cv.client.firstName} {cv.client.lastName}
                            </button>
                          ))}
                          {v.clients.length > 2 && (
                            <span className="text-xs text-slate-400">
                              +{v.clients.length - 2} más
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/vehicles/${v.id}`)}
                        title="Ver detalle"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
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
