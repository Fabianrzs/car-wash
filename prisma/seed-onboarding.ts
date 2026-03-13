import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL!;
const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
const pool = new pg.Pool({
  connectionString,
  ...(!isLocalhost && { ssl: { rejectUnauthorized: false } }),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const flows = [
  {
    key: "dashboard",
    title: "Bienvenido al Panel de Control",
    description: "Te mostramos los elementos principales del dashboard para que puedas comenzar a operar.",
    steps: [
      {
        title: "Estadísticas del Día",
        description: "Aquí puedes ver un resumen de los ingresos, órdenes, clientes y estado operativo del día.",
        target: "dashboard-stats",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Órdenes Recientes",
        description: "Consulta las últimas órdenes registradas. Haz clic en cualquiera para ver el detalle.",
        target: "dashboard-recent-orders",
        placement: "top",
        order: 2,
      },
    ],
  },
  {
    key: "orders",
    title: "Gestión de Órdenes",
    description: "Aprende a navegar y gestionar las órdenes de servicio.",
    steps: [
      {
        title: "Nueva Orden",
        description: "Haz clic aquí para registrar una nueva orden de lavado. Podrás seleccionar cliente, vehículo y servicios.",
        target: "orders-new-btn",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Filtrar por Estado",
        description: "Usa estas pestañas para ver órdenes por estado: pendientes, en proceso, completadas o canceladas.",
        target: "orders-status-tabs",
        placement: "bottom",
        order: 2,
      },
      {
        title: "Buscar Órdenes",
        description: "Escribe un número de orden para encontrarla rápidamente.",
        target: "orders-search",
        placement: "bottom",
        order: 3,
      },
      {
        title: "Tabla de Órdenes",
        description: "Aquí aparecen todas las órdenes del tenant. Haz clic en el ícono de ojo para ver el detalle completo.",
        target: "orders-table",
        placement: "top",
        order: 4,
      },
    ],
  },
  {
    key: "clients",
    title: "Gestión de Clientes",
    description: "Aprende a registrar y buscar clientes en el sistema.",
    steps: [
      {
        title: "Nuevo Cliente",
        description: "Haz clic aquí para registrar un nuevo cliente. Puedes agregar su vehículo al mismo tiempo.",
        target: "clients-new-btn",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Buscar Clientes",
        description: "Filtra clientes por nombre, teléfono o email. También puedes filtrar por clientes frecuentes.",
        target: "clients-search",
        placement: "bottom",
        order: 2,
      },
      {
        title: "Lista de Clientes",
        description: "Todos tus clientes registrados aparecen aquí. Haz clic en el ícono para ver su historial completo.",
        target: "clients-table",
        placement: "top",
        order: 3,
      },
    ],
  },
  {
    key: "vehicles",
    title: "Gestión de Vehículos",
    description: "Administra los vehículos registrados en el sistema.",
    steps: [
      {
        title: "Nuevo Vehículo",
        description: "Registra un nuevo vehículo y asócialo a uno o más clientes.",
        target: "vehicles-new-btn",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Tabla de Vehículos",
        description: "Aquí aparecen todos los vehículos registrados con su placa, tipo y clientes asociados.",
        target: "vehicles-table",
        placement: "top",
        order: 2,
      },
    ],
  },
  {
    key: "services",
    title: "Tipos de Servicio",
    description: "Configura los servicios de lavado que ofrece tu negocio.",
    steps: [
      {
        title: "Nuevo Servicio",
        description: "Crea un nuevo tipo de servicio con nombre, descripción, precio y duración estimada.",
        target: "services-new-btn",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Catálogo de Servicios",
        description: "Todos los servicios disponibles se muestran aquí. Haz clic en una tarjeta para editarla.",
        target: "services-grid",
        placement: "top",
        order: 2,
      },
    ],
  },
  {
    key: "team",
    title: "Gestión del Equipo",
    description: "Invita a tu equipo y administra los roles de cada miembro.",
    steps: [
      {
        title: "Invitar Miembro",
        description: "Ingresa el email de la persona que deseas invitar y selecciona su rol (Admin o Empleado).",
        target: "team-invite-form",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Miembros del Equipo",
        description: "Aquí verás todos los miembros activos. Puedes cambiar roles o remover miembros según necesites.",
        target: "team-members-list",
        placement: "top",
        order: 2,
      },
    ],
  },
  {
    key: "billing",
    title: "Facturación y Planes",
    description: "Revisa tu plan actual y los planes disponibles para renovar o cambiar.",
    steps: [
      {
        title: "Plan Actual",
        description: "Aquí ves tu plan activo, el precio, las fechas de vigencia y el estado de tu suscripción.",
        target: "billing-current-plan",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Planes Disponibles",
        description: "Explora los planes disponibles. Al seleccionar uno se genera una factura para activar el servicio.",
        target: "billing-plans-grid",
        placement: "top",
        order: 2,
      },
    ],
  },
  {
    key: "reports",
    title: "Reportes y Estadísticas",
    description: "Analiza el desempeño de tu negocio con reportes por período.",
    steps: [
      {
        title: "Selector de Período",
        description: "Elige entre Hoy, Esta Semana, Este Mes o un rango personalizado para filtrar los datos del reporte.",
        target: "reports-period-selector",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Estadísticas del Período",
        description: "Aquí ves los ingresos totales, número de órdenes, ticket promedio y órdenes completadas del período seleccionado.",
        target: "reports-stats",
        placement: "bottom",
        order: 2,
      },
    ],
  },
  {
    key: "settings",
    title: "Configuración del Lavadero",
    description: "Mantén la información de tu negocio actualizada.",
    steps: [
      {
        title: "Datos del Negocio",
        description: "Completa el nombre, teléfono, email y dirección de tu lavadero. Esta información aparece en las facturas y comunicaciones.",
        target: "settings-form",
        placement: "right",
        order: 1,
      },
    ],
  },
  {
    key: "mis-ordenes",
    title: "Mis Órdenes (Vista Empleado)",
    description: "Gestiona tus órdenes asignadas y toma nuevas del pool disponible.",
    steps: [
      {
        title: "Tus Estadísticas",
        description: "Aquí ves cuántas órdenes tienes asignadas hoy, cuántas están en progreso, completadas y tus ingresos generados.",
        target: "mis-ordenes-stats",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Mis Órdenes / Sin Asignar",
        description: "Alterna entre tus órdenes asignadas y el pool de órdenes pendientes sin lavador. Haz clic en 'Tomar' para asignarte una.",
        target: "mis-ordenes-main-tabs",
        placement: "bottom",
        order: 2,
      },
      {
        title: "Filtrar por Estado",
        description: "Filtra tus órdenes entre Pendientes, En Progreso o Completadas. Usa 'Iniciar' y 'Completar' para avanzar el estado.",
        target: "mis-ordenes-status-tabs",
        placement: "bottom",
        order: 3,
      },
    ],
  },
  // Admin panel flows
  {
    key: "admin-dashboard",
    title: "Panel de Administración",
    description: "Conoce las métricas globales y los tenants más recientes del sistema.",
    steps: [
      {
        title: "KPIs Globales",
        description: "Aquí ves el total de tenants, MRR, usuarios, órdenes y crecimiento mensual de toda la plataforma.",
        target: "admin-kpis",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Lavaderos Recientes",
        description: "Los últimos lavaderos registrados aparecen aquí. Haz clic en un nombre para ver su detalle o en 'Gestionar' para ingresar a su panel.",
        target: "admin-recent-tenants",
        placement: "top",
        order: 2,
      },
    ],
  },
  {
    key: "admin-tenants",
    title: "Gestión de Lavaderos",
    description: "Administra todos los tenants de la plataforma.",
    steps: [
      {
        title: "Nuevo Lavadero",
        description: "Crea un nuevo tenant con nombre, slug, plan y propietario. El owner recibirá acceso automático.",
        target: "admin-tenants-new-btn",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Buscar Tenants",
        description: "Filtra por nombre, slug o email para encontrar rápidamente un lavadero.",
        target: "admin-tenants-search",
        placement: "bottom",
        order: 2,
      },
      {
        title: "Tabla de Tenants",
        description: "Todos los lavaderos registrados con su plan, usuarios, clientes y estado. Haz clic en el nombre para ver el detalle.",
        target: "admin-tenants-table",
        placement: "top",
        order: 3,
      },
    ],
  },
  {
    key: "admin-plans",
    title: "Gestión de Planes",
    description: "Configura los planes de suscripción disponibles en la plataforma.",
    steps: [
      {
        title: "Nuevo Plan",
        description: "Crea un plan con nombre, precio, intervalo, límites de usuarios y órdenes, y características destacadas.",
        target: "admin-plans-new-btn",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Catálogo de Planes",
        description: "Todos los planes activos se muestran aquí con su precio, límites y número de tenants suscritos.",
        target: "admin-plans-grid",
        placement: "top",
        order: 2,
      },
    ],
  },
  {
    key: "admin-users",
    title: "Gestión de Usuarios",
    description: "Consulta todos los usuarios registrados en la plataforma.",
    steps: [
      {
        title: "Buscar Usuarios",
        description: "Filtra usuarios por nombre o email para encontrar una cuenta específica.",
        target: "admin-users-search",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Tabla de Usuarios",
        description: "Todos los usuarios con su rol global y los tenants a los que pertenecen.",
        target: "admin-users-table",
        placement: "top",
        order: 2,
      },
    ],
  },
  {
    key: "admin-onboarding",
    title: "Gestión de Onboarding",
    description: "Configura los tours interactivos que guían a los usuarios por la aplicación.",
    steps: [
      {
        title: "Nuevo Flow",
        description: "Crea un nuevo flow de onboarding con key única, título y descripción. Luego agrega los pasos desde el detalle.",
        target: "admin-onboarding-new-btn",
        placement: "bottom",
        order: 1,
      },
      {
        title: "Catálogo de Flows",
        description: "Todos los flows configurados aparecen aquí con su estado, número de pasos y completions. Haz clic en 'Configurar' para editar.",
        target: "admin-onboarding-grid",
        placement: "top",
        order: 2,
      },
    ],
  },
];

async function main() {
  console.log("Seeding onboarding flows...");

  for (const flowData of flows) {
    const { steps, ...flowFields } = flowData;

    const flow = await prisma.onboardingFlow.upsert({
      where: { key: flowFields.key },
      update: { title: flowFields.title, description: flowFields.description },
      create: { ...flowFields, isActive: true },
    });

    console.log(`  Flow: ${flow.key} (${flow.id})`);

    for (const step of steps) {
      const existing = await prisma.onboardingStep.findFirst({
        where: { flowId: flow.id, target: step.target },
      });

      if (existing) {
        await prisma.onboardingStep.update({
          where: { id: existing.id },
          data: step,
        });
        console.log(`    Step updated: ${step.title}`);
      } else {
        await prisma.onboardingStep.create({
          data: { ...step, flowId: flow.id },
        });
        console.log(`    Step created: ${step.title}`);
      }
    }
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
