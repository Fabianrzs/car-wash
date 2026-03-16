import { PrismaClient } from "@/generated/prisma/client";

const plansData = [
  {
    name: "Prueba Gratis",
    slug: "prueba-gratis",
    description: "Prueba todas las funcionalidades gratis por 1 mes",
    price: 0,
    interval: "MONTHLY" as const,
    maxUsers: 99,
    maxOrdersPerMonth: 99999,
    features: ["Todas las funcionalidades", "1 mes de prueba", "Sin tarjeta de credito", "Soporte basico"],
  },
  {
    name: "Basico",
    slug: "basico",
    description: "Plan ideal para lavaderos pequenos",
    price: 49900,
    interval: "MONTHLY" as const,
    maxUsers: 3,
    maxOrdersPerMonth: 200,
    features: ["Hasta 3 usuarios", "200 ordenes/mes", "Reportes basicos", "Soporte por email"],
  },
  {
    name: "Pro",
    slug: "pro",
    description: "Plan para lavaderos en crecimiento",
    price: 99900,
    interval: "MONTHLY" as const,
    maxUsers: 10,
    maxOrdersPerMonth: 1000,
    features: ["Hasta 10 usuarios", "1000 ordenes/mes", "Reportes avanzados", "Soporte prioritario", "Integraciones"],
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "Plan para cadenas de lavaderos",
    price: 199900,
    interval: "MONTHLY" as const,
    maxUsers: 50,
    maxOrdersPerMonth: 10000,
    features: ["Hasta 50 usuarios", "10000 ordenes/mes", "Reportes avanzados", "Soporte dedicado", "API personalizada", "Multi-sucursal"],
  },
];

export async function seedPlans(prisma: PrismaClient) {
  console.log("Creando planes...");
  const plans: Record<string, { id: string }> = {};

  for (const plan of plansData) {
    const created = await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
    plans[plan.slug] = created;
    console.log(`  -> Plan "${plan.name}"`);
  }

  return plans;
}
