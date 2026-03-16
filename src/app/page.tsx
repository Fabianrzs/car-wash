import type { Metadata } from "next";
import { listPublicPlansService } from "@/modules/plans/services/plans.service";
import { getPublicStatsService } from "@/modules/public-stats/services/public-stats.service";
import Link from "next/link";
import {
  Droplets,
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  UserCog,
  Check,
  ArrowRight,
  Car,
  Wrench,
  CreditCard,
  Shield,
  TrendingUp,
  Clock,
  Building2,
  CheckCircle,
  Zap,
  Lock,
  DollarSign,
  Smartphone,
  Bell,
  Award,
  Star,
  X,
  ChevronRight,
} from "lucide-react";

interface PublicPlan {
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

interface PublicStatsResponse {
  totalTenants: number;
  totalOrders: number;
  totalClients: number;
  totalVehicles: number;
}

export const metadata: Metadata = {
  title: "CarWashPro — Software de Gestión para Autolavados en Colombia",
  description:
    "Software para autolavados en Colombia: gestiona clientes, vehículos, órdenes y reportes financieros desde un solo lugar. Prueba gratis 30 días.",
  alternates: { canonical: "/" },
};

export const revalidate = 300;

async function getPageData() {
  const [plans, stats] = await Promise.all([
    listPublicPlansService().catch(() => [] as PublicPlan[]),
    getPublicStatsService().catch(() => ({ totalTenants: 0, totalOrders: 0, totalClients: 0, totalVehicles: 0 })),
  ]);
  return {
    plans,
    stats: {
      totalTenants: stats.totalTenants,
      totalOrders: stats.totalOrders,
      totalClients: stats.totalClients,
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://carwashpro.com.co/#organization",
      name: "CarWashPro",
      url: "https://carwashpro.com.co",
      logo: "https://carwashpro.com.co/logo.png",
      description:
        "Plataforma de gestión todo en uno para autolavados en Colombia.",
      address: { "@type": "PostalAddress", addressCountry: "CO" },
    },
    {
      "@type": "SoftwareApplication",
      name: "CarWashPro",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://carwashpro.com.co",
      description:
        "Software para autolavados en Colombia. Gestiona clientes, vehículos, órdenes de servicio, equipo y reportes financieros desde un solo sistema.",
      featureList: [
        "Gestión de órdenes de lavado",
        "Control de clientes y vehículos",
        "Reportes financieros en tiempo real",
        "Control de equipo con roles y permisos",
        "Facturación automática con PSE",
        "Dashboard operativo diario",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "COP",
        description: "Plan gratuito por 30 días sin tarjeta de crédito",
      },
      inLanguage: "es",
    },
  ],
};

export default async function LandingPage() {
  const { plans, stats } = await getPageData();
  const hasStats = stats.totalTenants > 0 || stats.totalOrders > 0;
  const currentYear = new Date().getFullYear();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen overflow-x-hidden bg-white">

        {/* ── Nav ── */}
        <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-zinc-900">
                CarWash<span className="text-zinc-500">Pro</span>
              </span>
            </div>
            <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 sm:flex">
              <a href="#como-funciona" className="transition-colors hover:text-zinc-900">Como Funciona</a>
              <a href="#funcionalidades" className="transition-colors hover:text-zinc-900">Funcionalidades</a>
              <a href="#pricing" className="transition-colors hover:text-zinc-900">Planes</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 sm:block"
              >
                Iniciar Sesion
              </Link>
              <Link
                href="/register?plan=prueba-gratis"
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                Prueba Gratis →
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <header className="relative mx-auto max-w-7xl px-6 pb-16 pt-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm font-semibold text-zinc-700">
            <span className="text-base">🇨🇴</span>
            Software #1 para Autolavados en Colombia
          </div>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
            Gestiona tu Autolavado<br />
            <span className="text-zinc-400">sin papel ni Excel</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-xl text-zinc-600">
            Clientes, vehículos, órdenes y reportes financieros en un solo sistema.
            Tu equipo trabaja mejor. Tu negocio crece con datos reales.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register?plan=prueba-gratis"
              className="group flex items-center gap-2 rounded-xl bg-zinc-900 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-zinc-800"
            >
              Empieza Gratis — 30 Dias
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#como-funciona"
              className="flex items-center gap-2 rounded-xl border-2 border-zinc-200 bg-white px-8 py-4 text-base font-semibold text-zinc-700 transition-all hover:border-zinc-400"
            >
              Ver como funciona ↓
            </a>
          </div>
          <p className="mt-4 text-sm text-zinc-400">
            ✓ Sin tarjeta de credito &nbsp;·&nbsp; ✓ Cancela cuando quieras &nbsp;·&nbsp; ✓ Soporte en español
          </p>

          {/* Mini dashboard preview */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: DollarSign, label: "Ingresos del dia", value: "$1.240.000" },
              { icon: ClipboardList, label: "Ordenes activas", value: "18" },
              { icon: Users, label: "Clientes atendidos", value: "12" },
              { icon: Clock, label: "En proceso ahora", value: "5" },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
                  <c.icon className="h-4 w-4 text-zinc-600" />
                </div>
                <p className="mt-3 text-xs text-zinc-500">{c.label}</p>
                <p className="text-lg font-bold text-zinc-900">{c.value}</p>
              </div>
            ))}
          </div>
        </header>

        {/* ── Stats bar ── */}
        {hasStats && (
          <section aria-label="Estadísticas de la plataforma" className="border-y border-zinc-200 bg-zinc-950">
            <div className="mx-auto grid max-w-7xl grid-cols-3 gap-1 px-6 py-8">
              {[
                { value: stats.totalTenants, label: "Lavaderos activos", icon: Building2 },
                { value: stats.totalOrders, label: "Ordenes procesadas", icon: ClipboardList },
                { value: stats.totalClients, label: "Clientes registrados", icon: Users },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center py-4 text-center">
                  <p className="text-3xl font-extrabold text-white">{s.value.toLocaleString()}+</p>
                  <p className="mt-1 text-sm text-zinc-400">{s.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Pain Points ── */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-zinc-900">¿Te suena familiar?</h2>
            <p className="mt-3 text-lg text-zinc-500">Los problemas mas comunes de los lavaderos sin sistema</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                problem: "Anotas las ordenes en papel y al final del dia no sabes cuanto ganaste",
                emoji: "📋",
              },
              {
                problem: "No sabes que vehiculos ya pasaron ni cuantas veces ha venido el cliente",
                emoji: "🚗",
              },
              {
                problem: "Tu equipo no tiene claridad de que esta haciendo cada quien en el momento",
                emoji: "😤",
              },
            ].map((p) => (
              <div
                key={p.problem}
                className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
              >
                <X className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <p className="text-sm font-medium text-zinc-700">{p.emoji} {p.problem}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-zinc-900 bg-zinc-900 px-8 py-6 text-center">
            <p className="text-lg font-bold text-white">
              CarWashPro resuelve todo esto —{" "}
              <span className="text-zinc-400">y tu equipo aprende a usarlo en menos de 10 minutos.</span>
            </p>
          </div>
        </section>

        {/* ── Como Funciona ── */}
        <section id="como-funciona" className="border-t border-zinc-100 bg-zinc-50 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <span className="inline-block rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-semibold text-zinc-600">
                Simple de usar
              </span>
              <h2 className="mt-4 text-4xl font-extrabold text-zinc-900">
                Listo en 3 pasos
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-lg text-zinc-600">
                Sin capacitacion compleja. Tu equipo opera desde el primer dia.
              </p>
            </div>

            <div className="relative mt-14 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  icon: Users,
                  title: "Registra el cliente y el vehiculo",
                  desc: "Nombre, telefono y placa. El sistema crea el perfil y el historial completo automaticamente.",
                  items: ["Busqueda rapida por nombre o telefono", "Clientes frecuentes marcados", "Multiples vehiculos por cliente"],
                },
                {
                  step: "2",
                  icon: ClipboardList,
                  title: "Abre la orden y elige servicios",
                  desc: "Selecciona uno o varios servicios de tu catalogo. El total se calcula solo.",
                  items: ["Multiples servicios por orden", "Asignacion de tecnico", "Notas internas por orden"],
                },
                {
                  step: "3",
                  icon: CheckCircle,
                  title: "Ejecuta, completa y cobra",
                  desc: "Cambia el estado de la orden en tiempo real. Cada paso queda registrado con hora exacta.",
                  items: ["Control de estados en vivo", "Historial de cambios por orden", "Refleja inmediato en reportes"],
                },
              ].map((s, i) => (
                <div key={s.step} className="relative">
                  {i < 2 && (
                    <ChevronRight className="absolute -right-3 top-10 hidden h-6 w-6 text-zinc-300 lg:block" />
                  )}
                  <div className="h-full rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900">
                        <s.icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-500">
                        Paso {s.step}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-zinc-900">{s.title}</h3>
                    <p className="mt-2 text-sm text-zinc-600">{s.desc}</p>
                    <ul className="mt-5 space-y-2">
                      {s.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-zinc-700">
                          <Check className="h-4 w-4 shrink-0 text-zinc-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Funcionalidades ── */}
        <section id="funcionalidades" className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center">
            <span className="inline-block rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm font-semibold text-zinc-600">
              Todo incluido
            </span>
            <h2 className="mt-4 text-4xl font-extrabold text-zinc-900">
              Todo lo que necesita tu lavadero
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-zinc-600">
              8 modulos integrados, disenados para la operacion real de un autolavado colombiano
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: LayoutDashboard, title: "Dashboard", tag: "Tiempo real",
                desc: "Ingresos del dia, ordenes activas, clientes atendidos y ticket promedio. Todo visible al abrir la app.",
              },
              {
                icon: ClipboardList, title: "Ordenes", tag: "Operacion",
                desc: "Crea, asigna y cierra ordenes en segundos. Historial completo con estados en tiempo real.",
              },
              {
                icon: Users, title: "Clientes", tag: "CRM",
                desc: "Perfil completo con historial de visitas, vehiculos vinculados y marcado de clientes frecuentes.",
              },
              {
                icon: Car, title: "Vehiculos", tag: "Catalogo",
                desc: "Sedan, SUV, camion, moto. Busqueda por placa. Un vehiculo puede tener multiples propietarios.",
              },
              {
                icon: Wrench, title: "Servicios", tag: "Tu catalogo",
                desc: "Define tus servicios con nombre, precio y duracion. Activa o desactiva por temporada.",
              },
              {
                icon: BarChart3, title: "Reportes", tag: "Analisis",
                desc: "Ingresos reales por dia, semana o mes. Top servicios por revenue. Exporta a CSV para tu contador.",
              },
              {
                icon: UserCog, title: "Equipo", tag: "RRHH",
                desc: "3 roles con permisos distintos. Invitacion por email. Tu equipo entra en minutos.",
              },
              {
                icon: CreditCard, title: "Facturacion", tag: "Pagos",
                desc: "Facturas automaticas con IVA. Paga con PSE. El plan se activa al confirmar el pago.",
              },
            ].map((m) => (
              <div
                key={m.title}
                className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100">
                    <m.icon className="h-5 w-5 text-zinc-700" />
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">{m.tag}</span>
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Por que elegirnos ── */}
        <section className="border-t border-zinc-100 bg-zinc-50 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h2 className="text-4xl font-extrabold text-zinc-900">
                Hecho para lavaderos colombianos
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-lg text-zinc-600">
                No es un software generico adaptado. Es una plataforma construida para tu realidad.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Smartphone, title: "Funciona en celular", desc: "Tu equipo opera desde el telefono sin instalar nada. Interfaz responsive 100%." },
                { icon: Building2, title: "Multi-sucursal", desc: "Gestiona varios lavaderos desde una sola cuenta. Datos completamente aislados." },
                { icon: Lock, title: "Datos seguros", desc: "JWT firmado, bcrypt y validacion de firma en pagos. Tu informacion protegida." },
                { icon: Zap, title: "Sin instalaciones", desc: "100% en la nube. Accede desde cualquier computador o celular. Cero configuracion." },
                { icon: TrendingUp, title: "Reportes reales", desc: "Solo cuentan ordenes completadas. Sin datos inflados. Numeros que puedes usar." },
                { icon: Bell, title: "Automatizado", desc: "Recordatorios de pago, activacion de planes y cambios de estado sin intervencion manual." },
              ].map((w) => (
                <div
                  key={w.title}
                  className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900">
                    <w.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900">{w.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600">{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Roles del Equipo ── */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center">
            <span className="inline-block rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm font-semibold text-zinc-600">
              Control de accesos
            </span>
            <h2 className="mt-4 text-4xl font-extrabold text-zinc-900">
              Cada quien con sus permisos
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-lg text-zinc-600">
              3 roles claros para la estructura real de tu lavadero
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              {
                role: "Propietario", icon: Award,
                badge: "bg-zinc-900 text-white",
                desc: "Control total del negocio, facturacion y configuracion.",
                perms: ["Todas las funcionalidades", "Configuracion del lavadero", "Acceso a facturacion", "Gestion completa del equipo", "Todos los reportes"],
              },
              {
                role: "Administrador", icon: Shield,
                badge: "bg-zinc-700 text-white",
                desc: "Gestion operativa sin acceso a facturacion.",
                perms: ["Crear y editar servicios", "Ver todos los reportes", "Gestionar clientes y vehiculos", "Crear y actualizar ordenes", "Invitar miembros al equipo"],
              },
              {
                role: "Empleado", icon: UserCog,
                badge: "bg-zinc-300 text-zinc-700",
                desc: "Operacion diaria del lavadero.",
                perms: ["Crear y actualizar ordenes", "Registrar clientes", "Ver su tablero de trabajo", "Consultar servicios"],
              },
            ].map((r) => (
              <div key={r.role} className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.badge}`}>
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${r.badge}`}>
                      {r.role}
                    </span>
                    <p className="mt-0.5 text-xs text-zinc-500">{r.desc}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-2">
                  {r.perms.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-zinc-700">
                      <CheckCircle className="h-4 w-4 shrink-0 text-zinc-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-zinc-500">
            Invitaciones por email · Tokens con vigencia de 7 dias · Cambio de roles en tiempo real
          </p>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="border-t border-zinc-100 bg-zinc-50 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <span className="inline-block rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-semibold text-zinc-600">
                Planes y Precios
              </span>
              <h2 className="mt-4 text-4xl font-extrabold text-zinc-900">
                Empieza gratis. Escala cuando crezcas.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-lg text-zinc-600">
                Sin tarjeta de credito. Sin letra pequena. Cancela cuando quieras.
              </p>
            </div>

            {plans.length > 0 ? (
              <div className="mt-12 flex flex-wrap justify-center gap-6">
                {plans.map((plan) => {
                  const isFree = Number(plan.price) === 0;
                  return (
                    <div
                      key={plan.id}
                      className={`relative w-full max-w-xs rounded-2xl bg-white p-8 transition-shadow ${
                        isFree
                          ? "border-2 border-zinc-900 shadow-xl"
                          : "border border-zinc-200 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {isFree && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-bold text-white">
                            <Star className="h-3 w-3" /> Recomendado para empezar
                          </span>
                        </div>
                      )}
                      <h3 className="text-xl font-extrabold text-zinc-900">{plan.name}</h3>
                      {plan.description && (
                        <p className="mt-1 text-sm text-zinc-500">{plan.description}</p>
                      )}
                      <div className="mt-5">
                        <span className="text-4xl font-extrabold text-zinc-900">
                          {isFree ? "Gratis" : `$${Number(plan.price).toLocaleString("es-CO")}`}
                        </span>
                        {!isFree && (
                          <span className="ml-1 text-sm text-zinc-500">
                            /{plan.interval === "MONTHLY" ? "mes" : "año"}
                          </span>
                        )}
                      </div>
                      <ul className="mt-6 space-y-2.5">
                        <li className="flex items-center gap-2 text-sm text-zinc-700">
                          <Check className="h-4 w-4 shrink-0 text-zinc-400" />
                          <strong>{plan.maxUsers}</strong>&nbsp;usuarios incluidos
                        </li>
                        <li className="flex items-center gap-2 text-sm text-zinc-700">
                          <Check className="h-4 w-4 shrink-0 text-zinc-400" />
                          <strong>{plan.maxOrdersPerMonth.toLocaleString()}</strong>&nbsp;ordenes/mes
                        </li>
                        {Array.isArray(plan.features) &&
                          (plan.features as string[]).map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                              <Check className="h-4 w-4 shrink-0 text-zinc-400" />
                              {f}
                            </li>
                          ))}
                      </ul>
                      <Link
                        href={`/register?plan=${plan.slug}`}
                        className={`mt-8 flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-colors ${
                          isFree
                            ? "bg-zinc-900 text-white hover:bg-zinc-800"
                            : "border-2 border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        {isFree ? "Comenzar Gratis" : "Seleccionar Plan"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-12 rounded-2xl border-2 border-zinc-900 bg-white p-10 text-center max-w-sm mx-auto shadow-xl">
                <p className="text-4xl font-extrabold text-zinc-900">Gratis</p>
                <p className="mt-1 text-zinc-500">30 dias de prueba completa</p>
                <Link
                  href="/register?plan=prueba-gratis"
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-zinc-800"
                >
                  Comenzar Gratis <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            <p className="mt-8 text-center text-sm text-zinc-500">
              Todos los planes incluyen todos los modulos · Pago con PSE o tarjeta · IVA incluido
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-center text-3xl font-extrabold text-zinc-900">
            Preguntas frecuentes
          </h2>
          <dl className="mt-10 space-y-4">
            {[
              {
                q: "¿Necesito instalar algo para usar CarWashPro?",
                a: "No. CarWashPro funciona 100% en el navegador web, desde computador o celular. No hay nada que instalar ni configurar.",
              },
              {
                q: "¿Cuantos empleados puedo agregar?",
                a: "Depende del plan. Cada plan incluye un numero de usuarios. Puedes invitar empleados y administradores por email desde el panel.",
              },
              {
                q: "¿Mis datos estan seguros?",
                a: "Si. Usamos autenticacion JWT, contrasenas con bcrypt y cada lavadero tiene sus datos completamente aislados de los demas.",
              },
              {
                q: "¿Puedo usar CarWashPro en varios lavaderos?",
                a: "Si. CarWashPro es multi-sucursal. Cada lavadero tiene su propia cuenta, datos, equipo y reportes separados.",
              },
              {
                q: "¿Como funciona el pago del plan?",
                a: "Pagas con PSE o tarjeta de credito. La factura se genera automaticamente con IVA incluido. El plan se activa al instante.",
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <dt className="font-bold text-zinc-900">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-zinc-600">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── CTA Final ── */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-8 py-16 text-center">
            <h2 className="text-4xl font-extrabold text-white">
              Tu lavadero, mas organizado que nunca
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              Unete a los lavaderos colombianos que ya operan con CarWashPro.
              Empieza gratis hoy.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register?plan=prueba-gratis"
                className="group flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                Prueba Gratis — 30 Dias
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border-2 border-zinc-700 px-8 py-4 text-base font-semibold text-white transition-colors hover:border-zinc-500"
              >
                Ya tengo cuenta
              </Link>
            </div>
            <p className="mt-6 text-sm text-zinc-500">
              ✓ Sin tarjeta de credito &nbsp;·&nbsp; ✓ Todos los modulos incluidos &nbsp;·&nbsp; ✓ Soporte en español
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid gap-8 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900">
                    <Droplets className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-extrabold text-zinc-900">
                    CarWash<span className="text-zinc-500">Pro</span>
                  </span>
                </div>
                <p className="mt-3 max-w-xs text-sm text-zinc-500">
                  Software todo en uno para la gestion profesional de autolavados en Colombia.
                </p>
                <p className="mt-3 text-xs text-zinc-400">
                  🇨🇴 Hecho para autolavaderos colombianos
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">Plataforma</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-500">
                  <li><a href="#como-funciona" className="transition-colors hover:text-zinc-900">Como Funciona</a></li>
                  <li><a href="#funcionalidades" className="transition-colors hover:text-zinc-900">Funcionalidades</a></li>
                  <li><a href="#pricing" className="transition-colors hover:text-zinc-900">Planes y Precios</a></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">Cuenta</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-500">
                  <li><Link href="/login" className="transition-colors hover:text-zinc-900">Iniciar Sesion</Link></li>
                  <li><Link href="/register" className="transition-colors hover:text-zinc-900">Registrarse</Link></li>
                  <li><Link href="/register?plan=prueba-gratis" className="transition-colors hover:text-zinc-900">Prueba Gratis</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-zinc-100 pt-6 sm:flex-row">
              <p className="text-xs text-zinc-400">
                &copy; {currentYear} CarWashPro. Todos los derechos reservados.
              </p>
              <p className="text-xs text-zinc-400">
                Software para autolavados · Colombia
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
