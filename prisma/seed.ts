import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { seedPlans } from "./seeds/plans.seed";
import { seedSuperAdmin, seedTenants, tenantsData } from "./seeds/tenants.seed";
import { seedDemoData } from "./seeds/demo-data.seed";
import { seedOnboarding } from "./seeds/onboarding.seed";

const connectionString = process.env.DATABASE_URL!;
const isLocalhost =
  connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const adapter = new PrismaPg({
  connectionString,
  ...(!isLocalhost && { ssl: { rejectUnauthorized: false } }),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("================================");
  console.log("Iniciando seed...");
  console.log("================================");

  const plans = await seedPlans(prisma);
  await seedSuperAdmin(prisma);
  const tenants = await seedTenants(prisma, plans);
  await seedDemoData(prisma, tenants);
  await seedOnboarding(prisma);

  console.log("\n================================");
  console.log("Seed completado exitosamente");
  console.log("================================");
  console.log("\nCredenciales:");
  console.log("  Super Admin : superadmin@carwash.com / superadmin123");
  console.log("  Tenants     : password123");
  console.log("\nTenants creados:");
  for (const td of tenantsData) {
    console.log(`  - ${td.name.padEnd(20)} slug: ${td.slug.padEnd(15)} owner: ${td.owner.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
