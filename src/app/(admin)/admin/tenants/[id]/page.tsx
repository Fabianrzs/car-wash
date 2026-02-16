"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Users, ClipboardList, Car, Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
const PROTOCOL = APP_DOMAIN.includes("localhost") ? "http" : "https";

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  plan: { id: string; name: string; price: number } | null;
  tenantUsers: {
    id: string;
    role: string;
    user: { id: string; name: string | null; email: string };
  }[];
  _count: { clients: number; serviceOrders: number; vehicles: number; serviceTypes: number };
}

export default function AdminTenantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/tenants/${id}`)
      .then((res) => res.json())
      .then(setTenant)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!tenant) {
    return <p className="text-gray-500">Tenant no encontrado</p>;
  }

  const stats = [
    { label: "Clientes", value: tenant._count.clients, icon: Users },
    { label: "Vehiculos", value: tenant._count.vehicles, icon: Car },
    { label: "Ordenes", value: tenant._count.serviceOrders, icon: ClipboardList },
    { label: "Servicios", value: tenant._count.serviceTypes, icon: Sparkles },
  ];

  return (
    <div>
      <Link href="/admin/tenants" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2">
            <Building2 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-sm text-gray-500">{tenant.slug}.carwash.com</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${PROTOCOL}://${tenant.slug}.${APP_DOMAIN}/dashboard`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4" />
            Gestionar
          </a>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${tenant.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {tenant.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <s.icon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">{s.label}</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Informacion</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{tenant.email || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Telefono</dt>
              <dd className="text-gray-900">{tenant.phone || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Direccion</dt>
              <dd className="text-gray-900">{tenant.address || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Plan</dt>
              <dd className="text-gray-900">{tenant.plan?.name || "Sin plan"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Creado</dt>
              <dd className="text-gray-900">{new Date(tenant.createdAt).toLocaleDateString("es-CO")}</dd>
            </div>
          </dl>
        </div>

        {/* Team */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">
            Equipo ({tenant.tenantUsers.length})
          </h2>
          <div className="space-y-2">
            {tenant.tenantUsers.map((tu) => (
              <div key={tu.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{tu.user.name || tu.user.email}</p>
                  <p className="text-xs text-gray-500">{tu.user.email}</p>
                </div>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  {tu.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
