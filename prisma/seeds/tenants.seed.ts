import { PrismaClient } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

type TenantRole = "ADMIN" | "EMPLOYEE";

interface TenantSeedData {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  planSlug: string;
  trialDays?: number;
  owner: { name: string; email: string };
  team: { name: string; email: string; role: TenantRole }[];
}

const tenantsData: TenantSeedData[] = [
  {
    name: "Demo Car Wash",
    slug: "demo",
    email: "admin@demo-carwash.com",
    phone: "3001234567",
    address: "Calle 123 #45-67, Bogota",
    planSlug: "basico",
    owner: { name: "Carlos Rodriguez", email: "carlos@demo-carwash.com" },
    team: [
      { name: "Maria Lopez", email: "maria@demo-carwash.com", role: "ADMIN" },
      { name: "Juan Torres", email: "juan@demo-carwash.com", role: "EMPLOYEE" },
    ],
  },
  {
    name: "Aqua Shine",
    slug: "aqua-shine",
    email: "info@aquashine.com",
    phone: "3109876543",
    address: "Avenida 68 #23-10, Bogota",
    planSlug: "pro",
    owner: { name: "Ana Martinez", email: "ana@aquashine.com" },
    team: [
      { name: "Pedro Gomez", email: "pedro@aquashine.com", role: "ADMIN" },
      { name: "Laura Rios", email: "laura@aquashine.com", role: "EMPLOYEE" },
      { name: "Diego Herrera", email: "diego@aquashine.com", role: "EMPLOYEE" },
    ],
  },
  {
    name: "Clean Express",
    slug: "clean-express",
    email: "contacto@cleanexpress.co",
    phone: "3205551234",
    address: "Carrera 15 #100-20, Bogota",
    planSlug: "enterprise",
    owner: { name: "Roberto Mendez", email: "roberto@cleanexpress.co" },
    team: [
      { name: "Sandra Ruiz", email: "sandra@cleanexpress.co", role: "ADMIN" },
      { name: "Andres Vargas", email: "andres@cleanexpress.co", role: "ADMIN" },
      { name: "Carolina Silva", email: "carolina@cleanexpress.co", role: "EMPLOYEE" },
      { name: "Felipe Castro", email: "felipe@cleanexpress.co", role: "EMPLOYEE" },
      { name: "Natalia Ortiz", email: "natalia@cleanexpress.co", role: "EMPLOYEE" },
    ],
  },
  {
    name: "Brillo Total",
    slug: "brillo-total",
    email: "admin@brillototal.com",
    phone: "3157778899",
    address: "Calle 80 #50-30, Medellin",
    planSlug: "prueba-gratis",
    trialDays: 30,
    owner: { name: "Valentina Duque", email: "valentina@brillototal.com" },
    team: [{ name: "Camilo Restrepo", email: "camilo@brillototal.com", role: "EMPLOYEE" }],
  },
  {
    name: "Auto Spa Premium",
    slug: "auto-spa",
    email: "info@autospa.co",
    phone: "3184449900",
    address: "Transversal 6 #22-15, Cali",
    planSlug: "pro",
    owner: { name: "Miguel Caicedo", email: "miguel@autospa.co" },
    team: [
      { name: "Isabella Muñoz", email: "isabella@autospa.co", role: "ADMIN" },
      { name: "Sebastian Lozano", email: "sebastian@autospa.co", role: "EMPLOYEE" },
    ],
  },
  {
    name: "Wash & Go",
    slug: "wash-and-go",
    email: "hola@washandgo.com",
    phone: "3006667788",
    address: "Calle 10 #4-55, Cartagena",
    planSlug: "basico",
    owner: { name: "Daniela Herrera", email: "daniela@washandgo.com" },
    team: [],
  },
  {
    name: "Lavadero El Paisa",
    slug: "el-paisa",
    email: "contacto@elpaisa.com",
    phone: "3112223344",
    address: "Carrera 70 #44-21, Medellin",
    planSlug: "prueba-gratis",
    trialDays: 15,
    owner: { name: "Esteban Giraldo", email: "esteban@elpaisa.com" },
    team: [
      { name: "Luisa Zapata", email: "luisa@elpaisa.com", role: "EMPLOYEE" },
      { name: "Mateo Arias", email: "mateo@elpaisa.com", role: "EMPLOYEE" },
    ],
  },
  {
    name: "Crystal Car",
    slug: "crystal-car",
    email: "info@crystalcar.co",
    phone: "3198881122",
    address: "Autopista Norte #180-50, Bogota",
    planSlug: "pro",
    owner: { name: "Alejandro Prieto", email: "alejandro@crystalcar.co" },
    team: [{ name: "Paula Benitez", email: "paula@crystalcar.co", role: "ADMIN" }],
  },
];

export async function seedSuperAdmin(prisma: PrismaClient) {
  console.log("\nCreando super admin...");
  const password = await bcrypt.hash("superadmin123", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@carwash.com" },
    update: { globalRole: "SUPER_ADMIN", password },
    create: {
      email: "superadmin@carwash.com",
      name: "Super Administrador",
      password,
      globalRole: "SUPER_ADMIN",
    },
  });

  console.log(`  -> ${superAdmin.email}`);
  return superAdmin;
}

export async function seedTenants(
  prisma: PrismaClient,
  plans: Record<string, { id: string }>
) {
  console.log("\nCreando tenants...");
  const password = await bcrypt.hash("password123", 12);
  const createdTenants: { id: string; slug: string; ownerId: string }[] = [];

  for (const td of tenantsData) {
    const plan = plans[td.planSlug];
    const trialEndsAt = td.trialDays
      ? new Date(Date.now() + td.trialDays * 24 * 60 * 60 * 1000)
      : null;

    const tenant = await prisma.tenant.upsert({
      where: { slug: td.slug },
      update: {},
      create: {
        name: td.name,
        slug: td.slug,
        email: td.email,
        phone: td.phone,
        address: td.address,
        trialEndsAt,
        ...(plan ? { plan: { connect: { id: plan.id } } } : {}),
      },
    });

    const owner = await prisma.user.upsert({
      where: { email: td.owner.email },
      update: {},
      create: { name: td.owner.name, email: td.owner.email, password, globalRole: "USER" },
    });

    await prisma.tenantUser.upsert({
      where: { userId_tenantId: { userId: owner.id, tenantId: tenant.id } },
      update: { role: "OWNER" },
      create: { userId: owner.id, tenantId: tenant.id, role: "OWNER" },
    });

    for (const member of td.team) {
      const user = await prisma.user.upsert({
        where: { email: member.email },
        update: {},
        create: { name: member.name, email: member.email, password, globalRole: "USER" },
      });
      await prisma.tenantUser.upsert({
        where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
        update: { role: member.role },
        create: { userId: user.id, tenantId: tenant.id, role: member.role },
      });
    }

    console.log(`  -> ${td.name} (${td.slug}) — owner: ${td.owner.email}, equipo: ${td.team.length}`);
    createdTenants.push({ id: tenant.id, slug: td.slug, ownerId: owner.id });
  }

  return createdTenants;
}

export { tenantsData };
