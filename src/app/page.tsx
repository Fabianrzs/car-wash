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
  Star,
  Wrench,
  CreditCard,
  FileText,
  Shield,
  TrendingUp,
  Clock,
  Search,
  Download,
  Building2,
  CheckCircle,
  Zap,
  Lock,
  ChevronRight,
  Play,
  DollarSign,
  Smartphone,
  Settings,
  Bell,
  PieChart,
  Activity,
  Award,
  Layers,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getPageData() {
  const [plans, totalTenants, totalOrders, totalClients, totalVehicles] =
    await Promise.all([
      prisma.plan.findMany({
        where: { isActive: true },
        select: {
          id: true, name: true, slug: true, description: true,
          price: true, interval: true, maxUsers: true,
          maxOrdersPerMonth: true, features: true,
        },
        orderBy: { price: "asc" },
      }),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.serviceOrder.count(),
      prisma.client.count(),
      prisma.vehicle.count(),
    ]);
  return { plans, stats: { totalTenants, totalOrders, totalClients, totalVehicles } };
}

export default async function LandingPage() {
  const { plans, stats } = await getPageData();
  const hasStats = stats.totalTenants > 0 || stats.totalOrders > 0;
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/30">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900">CarWash<span className="text-blue-600">Pro</span></span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 sm:flex">
            <a href="#como-funciona" className="hover:text-blue-600 transition-colors">Como Funciona</a>
            <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
            <a href="#flujo-admin" className="hover:text-blue-600 transition-colors">Flujo Admin</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Planes</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:block">
              Iniciar Sesion
            </Link>
            <Link href="/register?plan=prueba-gratis" className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-blue-800 transition-all">
              Prueba Gratis →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-transparent to-transparent" />
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
            <Zap className="h-3.5 w-3.5 text-blue-500" />
            Plataforma #1 para Autolavados en Colombia
          </div>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Gestiona tu Lavadero<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Como un Profesional
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
            Clientes, vehiculos, ordenes, equipo y reportes financieros en una sola plataforma.
            Sin instalaciones. Sin papeles. Sin complicaciones.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register?plan=prueba-gratis" className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all">
              Empieza Gratis — 30 Dias
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#como-funciona" className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-all">
              <Play className="h-4 w-4" />
              Ver como funciona
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">✓ Sin tarjeta de credito &nbsp;·&nbsp; ✓ Cancela cuando quieras &nbsp;·&nbsp; ✓ Soporte incluido</p>

          {/* Mini preview cards */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: DollarSign, label: "Ingresos Hoy", value: "$1.240.000", color: "text-green-600 bg-green-50" },
              { icon: ClipboardList, label: "Ordenes Activas", value: "18", color: "text-blue-600 bg-blue-50" },
              { icon: Users, label: "Clientes Hoy", value: "12", color: "text-purple-600 bg-purple-50" },
              { icon: Activity, label: "En Proceso", value: "5", color: "text-orange-600 bg-orange-50" },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
                  <c.icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-xs text-gray-500">{c.label}</p>
                <p className="text-lg font-bold text-gray-900">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      {hasStats && (
        <section className="border-y border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-1 px-6 py-10 sm:grid-cols-4">
            {[
              { value: stats.totalTenants, label: "Lavaderos Activos", icon: Building2 },
              { value: stats.totalOrders, label: "Ordenes Procesadas", icon: ClipboardList },
              { value: stats.totalClients, label: "Clientes Registrados", icon: Users },
              { value: stats.totalVehicles, label: "Vehiculos", icon: Car },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-4 text-center">
                <s.icon className="h-6 w-6 text-blue-200" />
                <p className="mt-2 text-3xl font-extrabold text-white">{s.value.toLocaleString()}+</p>
                <p className="mt-1 text-sm text-blue-100">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Como Funciona ─────────────────────────────────── */}
      <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
            Simple de usar
          </span>
          <h2 className="mt-4 text-4xl font-extrabold text-gray-900">Listo en 3 pasos</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
            Tu equipo aprende a usar el sistema en minutos. Sin capacitacion complicada.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1", icon: Users, color: "from-blue-500 to-blue-600",
              title: "Registra el Cliente y su Vehiculo",
              desc: "Ingresa nombre, telefono y placa. El sistema crea el perfil completo del cliente con historial de todas sus visitas.",
              detail: ["Busqueda rapida por nombre o telefono", "Marcado de clientes frecuentes", "Historial completo de ordenes"],
            },
            {
              step: "2", icon: ClipboardList, color: "from-indigo-500 to-indigo-600",
              title: "Crea la Orden y Elige Servicios",
              desc: "Selecciona uno o varios servicios de tu catalogo personalizado. El total se calcula automaticamente.",
              detail: ["Multiples servicios por orden", "Precios y duraciones configurables", "Notas internas por orden"],
            },
            {
              step: "3", icon: CheckCircle, color: "from-green-500 to-green-600",
              title: "Ejecuta y Cierra el Servicio",
              desc: "Actualiza el estado: Pendiente → En Proceso → Completado. Cada cambio queda registrado con fecha y hora.",
              detail: ["Registro automatico de tiempos", "Estado visible para todo el equipo", "Historial de cambios por orden"],
            },
          ].map((step, i) => (
            <div key={step.step} className="relative">
              {i < 2 && (
                <div className="absolute left-full top-10 hidden w-8 items-center justify-center lg:flex">
                  <ChevronRight className="h-6 w-6 text-gray-300" />
                </div>
              )}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg`}>
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                <div className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500 ml-2 align-bottom">
                  Paso {step.step}
                </div>
                <h3 className="mt-5 text-xl font-bold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{step.desc}</p>
                <ul className="mt-5 space-y-2">
                  {step.detail.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 shrink-0 text-green-500" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Funcionalidades ───────────────────────────────── */}
      <section id="funcionalidades" className="bg-gradient-to-b from-gray-50 to-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700">
              8 modulos integrados
            </span>
            <h2 className="mt-4 text-4xl font-extrabold text-gray-900">
              Todo lo que necesita tu lavadero
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Disenado especificamente para la operacion real de un autolavado colombiano
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: LayoutDashboard, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600",
                title: "Dashboard", tag: "Tiempo Real",
                items: ["Ingresos del dia", "Ordenes activas y completadas", "Clientes atendidos hoy", "Ticket promedio diario"] },
              { icon: ClipboardList, color: "from-green-500 to-green-600", bg: "bg-green-50", text: "text-green-600",
                title: "Ordenes", tag: "Operacion",
                items: ["Creacion rapida de ordenes", "Multiples servicios por orden", "Control de estados", "Historial completo"] },
              { icon: Users, color: "from-purple-500 to-purple-600", bg: "bg-purple-50", text: "text-purple-600",
                title: "Clientes", tag: "CRM Basico",
                items: ["Perfil completo del cliente", "Historial de visitas", "Clientes frecuentes", "Busqueda inteligente"] },
              { icon: Car, color: "from-orange-500 to-orange-600", bg: "bg-orange-50", text: "text-orange-600",
                title: "Vehiculos", tag: "Catalogo",
                items: ["Sedan, SUV, Camion, Moto", "Busqueda por placa", "Vinculado al cliente", "Historial por vehiculo"] },
              { icon: Wrench, color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50", text: "text-cyan-600",
                title: "Servicios", tag: "Catalogo",
                items: ["Nombre y precio propios", "Duracion estimada", "Activo/Inactivo por temporada", "Sin limite de servicios"] },
              { icon: BarChart3, color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50", text: "text-indigo-600",
                title: "Reportes", tag: "Analisis",
                items: ["Hoy, semana, mes, personalizado", "Top servicios por revenue", "Exportacion a Excel/CSV", "Desglose por dia"] },
              { icon: UserCog, color: "from-rose-500 to-rose-600", bg: "bg-rose-50", text: "text-rose-600",
                title: "Equipo", tag: "RRHH",
                items: ["3 roles con permisos distintos", "Invitacion por email", "Cambio de roles en vivo", "Sin limite de usuarios*"] },
              { icon: CreditCard, color: "from-amber-500 to-amber-600", bg: "bg-amber-50", text: "text-amber-600",
                title: "Facturacion", tag: "Pagos",
                items: ["Facturas automaticas con IVA", "Pago con PSE o tarjeta", "Activacion instantanea", "Historial de pagos"] },
            ].map((m) => (
              <div key={m.title} className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${m.color} shadow-md`}>
                    <m.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`rounded-full ${m.bg} ${m.text} px-2 py-0.5 text-xs font-semibold`}>{m.tag}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{m.title}</h3>
                <ul className="mt-3 space-y-1.5">
                  {m.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Flujo Administrativo Completo ─────────────────── */}
      <section id="flujo-admin" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-700">
              Flujo Administrativo
            </span>
            <h2 className="mt-4 text-4xl font-extrabold text-gray-900">
              Control total del negocio
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Desde el registro hasta el cierre de caja, cada proceso esta cubierto
            </p>
          </div>

          {/* Setup inicial */}
          <div className="mt-16 rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 md:p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Fase 1</p>
                <h3 className="text-2xl font-extrabold text-gray-900">Configuracion Inicial</h3>
              </div>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { n: "1", title: "Crea tu cuenta", desc: "Registra el nombre del lavadero, elige un plan y listo. En menos de 2 minutos." },
                { n: "2", title: "Define tus servicios", desc: "Lavado basico, completo, premium, detailing. Tu catalogo con tus precios." },
                { n: "3", title: "Agrega tu equipo", desc: "Invita empleados y admins por email. Asigna roles segun su funcion." },
                { n: "4", title: "Personaliza tu perfil", desc: "Nombre, logo, telefono, email y direccion de tu lavadero." },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl bg-white p-5 shadow-sm">
                  <span className="text-3xl font-extrabold text-blue-100">{s.n}</span>
                  <h4 className="mt-1 font-bold text-gray-900">{s.title}</h4>
                  <p className="mt-1 text-sm text-gray-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Operacion diaria */}
          <div className="mt-8 rounded-3xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-8 md:p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600">
                <Play className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-green-500">Fase 2 — Diaria</p>
                <h3 className="text-2xl font-extrabold text-gray-900">Operacion del Dia a Dia</h3>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Users, title: "Registra el cliente", desc: "Nuevo o recurrente. Busca por nombre o telefono, en segundos." },
                { icon: Car, title: "Vincula el vehiculo", desc: "Placa, marca, modelo y tipo. Queda guardado para proximas visitas." },
                { icon: ClipboardList, title: "Abre la orden", desc: "Selecciona servicios, agrega notas y asigna al tecnico." },
                { icon: Clock, title: "Inicia el servicio", desc: "Cambia a En Proceso. El sistema registra la hora de inicio automaticamente." },
                { icon: CheckCircle, title: "Completa y cobra", desc: "Marca como Completado. El monto queda registrado en los reportes." },
                { icon: TrendingUp, title: "Cierre del dia", desc: "Revisa ingresos, ordenes y clientes del dia desde el dashboard." },
              ].map((s) => (
                <div key={s.title} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100">
                    <s.icon className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{s.title}</h4>
                    <p className="mt-0.5 text-xs text-gray-600">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analisis y crecimiento */}
          <div className="mt-8 rounded-3xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 md:p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
                <PieChart className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Fase 3</p>
                <h3 className="text-2xl font-extrabold text-gray-900">Analisis y Crecimiento</h3>
              </div>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                {[
                  { icon: DollarSign, label: "Ingresos reales", desc: "Solo ordenes completadas cuentan. Sin datos inflados." },
                  { icon: BarChart3, label: "Top servicios", desc: "Descubre que servicios generan mas dinero y enfoca tu marketing." },
                  { icon: Search, label: "Filtro avanzado", desc: "Busca por cliente, placa, numero de orden o estado en segundos." },
                  { icon: Download, label: "Exporta a Excel", desc: "Descarga reportes CSV para tu contador o para analisis externo." },
                ].map((r) => (
                  <div key={r.label} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                      <r.icon className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{r.label}</p>
                      <p className="text-xs text-gray-600">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm font-bold text-gray-900">Resumen del Mes — Ejemplo</p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Ingresos totales", value: "$18.540.000", color: "text-green-600" },
                    { label: "Total ordenes", value: "284", color: "text-blue-600" },
                    { label: "Ticket promedio", value: "$65.282", color: "text-purple-600" },
                    { label: "Ordenes completadas", value: "271 (95%)", color: "text-indigo-600" },
                    { label: "Servicio mas vendido", value: "Lavado Completo", color: "text-orange-600" },
                    { label: "Clientes atendidos", value: "198 unicos", color: "text-cyan-600" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs text-gray-500">{row.label}</span>
                      <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Facturacion */}
          <div className="mt-8 rounded-3xl border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-8 md:p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">Fase 4</p>
                <h3 className="text-2xl font-extrabold text-gray-900">Facturacion de tu Plan</h3>
              </div>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Bell, title: "Recordatorios automaticos", desc: "Avisos 7, 3 y 1 dia antes del vencimiento del plan." },
                { icon: FileText, title: "Factura automatica", desc: "Se genera sola con IVA incluido (19%). Sin trabajo manual." },
                { icon: Building2, title: "Pago con PSE", desc: "Transferencia desde cualquier banco colombiano. Seguro y rapido." },
                { icon: Zap, title: "Activacion inmediata", desc: "El plan se activa automaticamente al confirmar el pago. Sin esperas." },
              ].map((p) => (
                <div key={p.title} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                    <p.icon className="h-5 w-5 text-amber-600" />
                  </div>
                  <h4 className="mt-3 font-bold text-gray-900 text-sm">{p.title}</h4>
                  <p className="mt-1 text-xs text-gray-600">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Roles del Equipo ──────────────────────────────── */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-rose-50 px-4 py-1.5 text-sm font-semibold text-rose-700">
              Control de Accesos
            </span>
            <h2 className="mt-4 text-4xl font-extrabold text-gray-900">
              Cada quien con sus permisos
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
              Tres roles claros para la estructura real de tu lavadero
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                role: "Propietario", badge: "bg-purple-600",
                border: "border-purple-200", bg: "from-purple-50 to-white",
                icon: Award,
                perms: ["Control total del negocio", "Invitar y remover colaboradores", "Cambiar roles del equipo", "Acceso a facturacion y planes", "Configuracion del lavadero", "Ver todos los reportes"],
              },
              {
                role: "Administrador", badge: "bg-blue-600",
                border: "border-blue-200", bg: "from-blue-50 to-white",
                icon: Shield,
                perms: ["Crear y editar servicios", "Ver todos los reportes", "Gestionar clientes y vehiculos", "Crear y actualizar ordenes", "Invitar miembros al equipo", "Cambiar roles (excepto owner)"],
              },
              {
                role: "Empleado", badge: "bg-gray-500",
                border: "border-gray-200", bg: "from-gray-50 to-white",
                icon: UserCog,
                perms: ["Crear y actualizar ordenes", "Registrar clientes y vehiculos", "Ver dashboard diario", "Consultar catalogo de servicios"],
              },
            ].map((r) => (
              <div key={r.role} className={`rounded-2xl border-2 bg-gradient-to-b ${r.border} ${r.bg} p-7 shadow-sm`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.badge}`}>
                    <r.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className={`inline-block rounded-full ${r.badge} px-3 py-0.5 text-xs font-bold text-white`}>{r.role}</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {r.perms.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-500">
            Invitaciones por email · Tokens con vigencia de 7 dias · Cambio de roles en tiempo real
          </p>
        </div>
      </section>

      {/* ── Por que elegirnos ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900">Por que elegir CarWashPro</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
            Construido especificamente para la realidad del mercado colombiano
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Smartphone, title: "Funciona en celular", desc: "Interfaz responsive. Tu equipo puede operar desde el telefono sin instalar nada." },
            { icon: Layers, title: "Multi-sucursal", desc: "Gestiona varios lavaderos desde una sola cuenta. Cada uno con sus datos aislados." },
            { icon: Lock, title: "Datos seguros", desc: "JWT firmado, bcrypt, rate limiting y validacion de firma en pagos PayU." },
            { icon: Zap, title: "Sin instalaciones", desc: "100% en la nube. Accede desde cualquier computador o celular sin configurar nada." },
            { icon: TrendingUp, title: "Reportes de valor real", desc: "Solo cuentan ordenes completadas. Sin datos inflados ni metricas de vanidad." },
            { icon: Bell, title: "Automatizacion", desc: "Recordatorios de pago, cambios de plan y activaciones sin intervencion manual." },
          ].map((w) => (
            <div key={w.title} className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
                <w.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{w.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────── */}
      <section id="pricing" className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
              Planes y Precios
            </span>
            <h2 className="mt-4 text-4xl font-extrabold text-gray-900">
              Elige el plan de tu lavadero
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
              Comienza gratis. Sin tarjeta de credito. Escala cuando crezcas.
            </p>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8">
            {plans.map((plan) => {
              const isFree = Number(plan.price) === 0;
              return (
                <div
                  key={plan.id}
                  className={`relative w-full max-w-xs rounded-2xl bg-white p-8 shadow-sm ${
                    isFree
                      ? "border-2 border-blue-500 shadow-xl shadow-blue-500/10"
                      : "border border-gray-200 hover:shadow-md"
                  } transition-shadow`}
                >
                  {isFree && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md">
                        <Star className="h-3 w-3" /> Recomendado para empezar
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-extrabold text-gray-900">{plan.name}</h3>
                  {plan.description && (
                    <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  )}
                  <div className="mt-5">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {isFree ? "Gratis" : `$${Number(plan.price).toLocaleString("es-CO")}`}
                    </span>
                    {!isFree && (
                      <span className="text-sm text-gray-500 ml-1">
                        /{plan.interval === "MONTHLY" ? "mes" : "ano"}
                      </span>
                    )}
                  </div>
                  <ul className="mt-6 space-y-2.5">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 shrink-0 text-green-500" />
                      <strong>{plan.maxUsers}</strong>&nbsp;usuarios incluidos
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 shrink-0 text-green-500" />
                      <strong>{plan.maxOrdersPerMonth.toLocaleString()}</strong>&nbsp;ordenes/mes
                    </li>
                    {Array.isArray(plan.features) &&
                      (plan.features as string[]).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="h-4 w-4 shrink-0 text-green-500" />
                          {f}
                        </li>
                      ))}
                  </ul>
                  <Link
                    href={`/register?plan=${plan.slug}`}
                    className={`mt-8 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all ${
                      isFree
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700"
                        : "border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700"
                    }`}
                  >
                    {isFree ? "Comenzar Gratis" : "Seleccionar Plan"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-center text-sm text-gray-500">
            Todos los planes incluyen todos los modulos · Pago con PSE o tarjeta · IVA incluido en la factura
          </p>
        </div>
      </section>

      {/* ── CTA Final ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-16 text-center shadow-2xl shadow-blue-500/20">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-indigo-400/10 blur-2xl" />
          <div className="relative">
            <Car className="mx-auto h-14 w-14 text-blue-200" />
            <h2 className="mt-4 text-4xl font-extrabold text-white">
              Tu lavadero, mas organizado que nunca
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
              Unete a los lavaderos que ya operan con CarWashPro.
              Empieza gratis hoy, sin tarjeta de credito.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register?plan=prueba-gratis"
                className="group flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-blue-600 shadow-xl hover:bg-blue-50 transition-colors"
              >
                Prueba Gratis 30 Dias
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border-2 border-blue-400 px-8 py-4 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/20">
                  <Droplets className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-extrabold text-gray-900">CarWash<span className="text-blue-600">Pro</span></span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-gray-500">
                Plataforma todo-en-uno para la gestion profesional de autolavados en Colombia.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Plataforma</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                <li><a href="#como-funciona" className="hover:text-blue-600">Como Funciona</a></li>
                <li><a href="#funcionalidades" className="hover:text-blue-600">Funcionalidades</a></li>
                <li><a href="#flujo-admin" className="hover:text-blue-600">Flujo Admin</a></li>
                <li><a href="#pricing" className="hover:text-blue-600">Planes</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Cuenta</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                <li><Link href="/login" className="hover:text-blue-600">Iniciar Sesion</Link></li>
                <li><Link href="/register" className="hover:text-blue-600">Registrarse</Link></li>
                <li><Link href="/register?plan=prueba-gratis" className="hover:text-blue-600">Prueba Gratis</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
            <p className="text-xs text-gray-400">&copy; {currentYear} CarWashPro. Todos los derechos reservados.</p>
            <p className="text-xs text-gray-400">Hecho con ❤️ para autolavaderos colombianos</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
