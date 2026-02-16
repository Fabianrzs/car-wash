"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Droplets,
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  UserCog,
  Building2,
  Check,
  ArrowRight,
  Car,
  Star,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  interval: string;
  maxUsers: number;
  maxOrdersPerMonth: number;
  features: string[];
}

interface Stats {
  totalTenants: number;
  totalOrders: number;
  totalClients: number;
  totalVehicles: number;
}

const features = [
  { icon: LayoutDashboard, title: "Dashboard", desc: "Vista general de tu negocio en tiempo real" },
  { icon: Users, title: "Clientes", desc: "Gestion completa de tu base de clientes" },
  { icon: ClipboardList, title: "Ordenes", desc: "Control de ordenes desde creacion hasta completado" },
  { icon: BarChart3, title: "Reportes", desc: "Reportes detallados de ingresos y servicios" },
  { icon: UserCog, title: "Equipo", desc: "Administra roles y permisos de tu equipo" },
  { icon: Building2, title: "Multi-sucursal", desc: "Gestiona multiples sucursales desde una cuenta" },
];

export default function LandingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/plans").then((r) => r.json()).then(setPlans).catch(() => {});
    fetch("/api/public-stats").then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Car Wash</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Iniciar Sesion
            </Link>
            <Link
              href="/register?plan=prueba-gratis"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Prueba Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Gestiona tu Lavadero de Autos
          </h1>
          <p className="mt-6 text-lg text-gray-600 sm:text-xl">
            La plataforma todo-en-uno para administrar tu lavadero. Clientes, ordenes, reportes y equipo en un solo lugar.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register?plan=prueba-gratis"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
            >
              Prueba Gratis 30 Dias
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#pricing"
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-8 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
            >
              Ver Planes
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (stats.totalTenants > 0 || stats.totalOrders > 0) && (
        <section className="border-y border-gray-100 bg-gray-50">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.totalTenants}+</p>
              <p className="mt-1 text-sm text-gray-600">Lavaderos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.totalOrders.toLocaleString()}+</p>
              <p className="mt-1 text-sm text-gray-600">Ordenes Procesadas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.totalClients.toLocaleString()}+</p>
              <p className="mt-1 text-sm text-gray-600">Clientes Registrados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.totalVehicles.toLocaleString()}+</p>
              <p className="mt-1 text-sm text-gray-600">Vehiculos</p>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Todo lo que necesitas para tu lavadero
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
          Funcionalidades pensadas para que administres tu negocio de forma eficiente
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <f.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-gray-100 bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">Planes y Precios</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
            Elige el plan que mejor se adapte a tu negocio
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const isFree = Number(plan.price) === 0;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border-2 bg-white p-8 ${
                    isFree ? "border-blue-600 shadow-lg" : "border-gray-200"
                  }`}
                >
                  {isFree && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        <Star className="h-3 w-3" /> Gratis 1 Mes
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {plan.description && (
                    <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                  )}
                  <p className="mt-4 text-4xl font-extrabold text-gray-900">
                    {isFree ? "Gratis" : `$${Number(plan.price).toLocaleString("es-CO")}`}
                    {!isFree && (
                      <span className="text-base font-normal text-gray-500">
                        /{plan.interval === "MONTHLY" ? "mes" : "ano"}
                      </span>
                    )}
                  </p>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500" />
                      Hasta {plan.maxUsers} usuarios
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500" />
                      {plan.maxOrdersPerMonth.toLocaleString()} ordenes/mes
                    </li>
                    {Array.isArray(plan.features) &&
                      (plan.features as string[]).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-500" />
                          {f}
                        </li>
                      ))}
                  </ul>
                  <Link
                    href={`/register?plan=${plan.slug}`}
                    className={`mt-8 block rounded-lg px-6 py-3 text-center text-sm font-semibold ${
                      isFree
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {isFree ? "Comenzar Gratis" : "Seleccionar Plan"}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="rounded-2xl bg-blue-600 px-8 py-14">
          <Car className="mx-auto h-12 w-12 text-blue-200" />
          <h2 className="mt-4 text-3xl font-bold text-white">
            Comienza Ahora
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100">
            Unete a los lavaderos que ya gestionan su negocio de forma inteligente. Sin tarjeta de credito.
          </p>
          <Link
            href="/register?plan=prueba-gratis"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-600 hover:bg-blue-50"
          >
            Prueba Gratis 30 Dias
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Droplets className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Car Wash</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/login" className="hover:text-gray-700">Iniciar Sesion</Link>
              <Link href="/register" className="hover:text-gray-700">Registrarse</Link>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Car Wash. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
