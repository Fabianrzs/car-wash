"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";
import { Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react";

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  vehicleType: string;
  client: { id: string; firstName: string; lastName: string };
}

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVehicles = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    const res = await fetch(`/api/vehicles?${params}`);
    const data = await res.json();
    setVehicles(data.vehicles || []);
    setTotalPages(data.pages || 1);
    setLoading(false);
  };

  useEffect(() => { fetchVehicles(); }, [page, search]);

  return (
    <div className="p-6">
      <PageHeader title="Vehiculos" description="Gestion de vehiculos registrados">
        <Button onClick={() => router.push("/vehicles/new")}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Vehiculo
        </Button>
      </PageHeader>

      <div className="mt-6">
        <div className="mb-4 max-w-sm">
          <Input
            placeholder="Buscar por placa..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      No se encontraron vehiculos
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.plate}</TableCell>
                      <TableCell>{v.brand}</TableCell>
                      <TableCell>{v.model}</TableCell>
                      <TableCell>{VEHICLE_TYPE_LABELS[v.vehicleType] || v.vehicleType}</TableCell>
                      <TableCell>{v.color || "-"}</TableCell>
                      <TableCell>
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => router.push(`/clients/${v.client.id}`)}
                        >
                          {v.client.firstName} {v.client.lastName}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/vehicles/${v.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">Pagina {page} de {totalPages}</span>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
