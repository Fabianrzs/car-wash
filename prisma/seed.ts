import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);
  const superAdminPassword = await bcrypt.hash("superadmin123", 12);

  // =============================================
  // 1. Create Plans
  // =============================================
  const trialPlan = await prisma.plan.upsert({
    where: { slug: "prueba-gratis" },
    update: {},
    create: {
      name: "Prueba Gratis",
      slug: "prueba-gratis",
      description: "Prueba todas las funcionalidades gratis por 1 mes",
      price: 0,
      interval: "MONTHLY",
      maxUsers: 99,
      maxOrdersPerMonth: 99999,
      features: ["Todas las funcionalidades", "1 mes de prueba", "Sin tarjeta de credito", "Soporte basico"],
    },
  });

  const basicPlan = await prisma.plan.upsert({
    where: { slug: "basico" },
    update: {},
    create: {
      name: "Basico",
      slug: "basico",
      description: "Plan ideal para lavaderos pequenos",
      price: 49900,
      interval: "MONTHLY",
      maxUsers: 3,
      maxOrdersPerMonth: 200,
      features: ["Hasta 3 usuarios", "200 ordenes/mes", "Reportes basicos", "Soporte por email"],
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      name: "Pro",
      slug: "pro",
      description: "Plan para lavaderos en crecimiento",
      price: 99900,
      interval: "MONTHLY",
      maxUsers: 10,
      maxOrdersPerMonth: 1000,
      features: ["Hasta 10 usuarios", "1000 ordenes/mes", "Reportes avanzados", "Soporte prioritario", "Integraciones"],
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { slug: "enterprise" },
    update: {},
    create: {
      name: "Enterprise",
      slug: "enterprise",
      description: "Plan para cadenas de lavaderos",
      price: 199900,
      interval: "MONTHLY",
      maxUsers: 50,
      maxOrdersPerMonth: 10000,
      features: ["Hasta 50 usuarios", "10000 ordenes/mes", "Reportes avanzados", "Soporte dedicado", "API personalizada", "Multi-sucursal"],
    },
  });

  console.log(`Planes creados: ${trialPlan.name}, ${basicPlan.name}, ${proPlan.name}, ${enterprisePlan.name}`);

  // =============================================
  // 2. Create Super Admin
  // =============================================
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@carwash.com" },
    update: { globalRole: "SUPER_ADMIN", password: superAdminPassword },
    create: {
      email: "superadmin@carwash.com",
      name: "Super Administrador",
      password: superAdminPassword,
      globalRole: "SUPER_ADMIN",
    },
  });
  console.log(`Super Admin: ${superAdmin.email}`);

  // =============================================
  // 3. Define tenant data
  // =============================================
  const tenantsData = [
    {
      name: "Demo Car Wash",
      slug: "demo",
      email: "admin@demo-carwash.com",
      phone: "3001234567",
      address: "Calle 123 #45-67, Bogota",
      planId: basicPlan.id,
      owner: { name: "Carlos Rodriguez", email: "carlos@demo-carwash.com" },
      team: [
        { name: "Maria Lopez", email: "maria@demo-carwash.com", role: "ADMIN" as const },
        { name: "Juan Torres", email: "juan@demo-carwash.com", role: "EMPLOYEE" as const },
      ],
    },
    {
      name: "Aqua Shine",
      slug: "aqua-shine",
      email: "info@aquashine.com",
      phone: "3109876543",
      address: "Avenida 68 #23-10, Bogota",
      planId: proPlan.id,
      owner: { name: "Ana Martinez", email: "ana@aquashine.com" },
      team: [
        { name: "Pedro Gomez", email: "pedro@aquashine.com", role: "ADMIN" as const },
        { name: "Laura Rios", email: "laura@aquashine.com", role: "EMPLOYEE" as const },
        { name: "Diego Herrera", email: "diego@aquashine.com", role: "EMPLOYEE" as const },
      ],
    },
    {
      name: "Clean Express",
      slug: "clean-express",
      email: "contacto@cleanexpress.co",
      phone: "3205551234",
      address: "Carrera 15 #100-20, Bogota",
      planId: enterprisePlan.id,
      owner: { name: "Roberto Mendez", email: "roberto@cleanexpress.co" },
      team: [
        { name: "Sandra Ruiz", email: "sandra@cleanexpress.co", role: "ADMIN" as const },
        { name: "Andres Vargas", email: "andres@cleanexpress.co", role: "ADMIN" as const },
        { name: "Carolina Silva", email: "carolina@cleanexpress.co", role: "EMPLOYEE" as const },
        { name: "Felipe Castro", email: "felipe@cleanexpress.co", role: "EMPLOYEE" as const },
        { name: "Natalia Ortiz", email: "natalia@cleanexpress.co", role: "EMPLOYEE" as const },
      ],
    },
    {
      name: "Brillo Total",
      slug: "brillo-total",
      email: "admin@brillototal.com",
      phone: "3157778899",
      address: "Calle 80 #50-30, Medellin",
      planId: trialPlan.id,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      owner: { name: "Valentina Duque", email: "valentina@brillototal.com" },
      team: [
        { name: "Camilo Restrepo", email: "camilo@brillototal.com", role: "EMPLOYEE" as const },
      ],
    },
    {
      name: "Auto Spa Premium",
      slug: "auto-spa",
      email: "info@autospa.co",
      phone: "3184449900",
      address: "Transversal 6 #22-15, Cali",
      planId: proPlan.id,
      owner: { name: "Miguel Caicedo", email: "miguel@autospa.co" },
      team: [
        { name: "Isabella Muñoz", email: "isabella@autospa.co", role: "ADMIN" as const },
        { name: "Sebastian Lozano", email: "sebastian@autospa.co", role: "EMPLOYEE" as const },
      ],
    },
    {
      name: "Wash & Go",
      slug: "wash-and-go",
      email: "hola@washandgo.com",
      phone: "3006667788",
      address: "Calle 10 #4-55, Cartagena",
      planId: basicPlan.id,
      owner: { name: "Daniela Herrera", email: "daniela@washandgo.com" },
      team: [],
    },
    {
      name: "Lavadero El Paisa",
      slug: "el-paisa",
      email: "contacto@elpaisa.com",
      phone: "3112223344",
      address: "Carrera 70 #44-21, Medellin",
      planId: trialPlan.id,
      trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      owner: { name: "Esteban Giraldo", email: "esteban@elpaisa.com" },
      team: [
        { name: "Luisa Zapata", email: "luisa@elpaisa.com", role: "EMPLOYEE" as const },
        { name: "Mateo Arias", email: "mateo@elpaisa.com", role: "EMPLOYEE" as const },
      ],
    },
    {
      name: "Crystal Car",
      slug: "crystal-car",
      email: "info@crystalcar.co",
      phone: "3198881122",
      address: "Autopista Norte #180-50, Bogota",
      planId: proPlan.id,
      owner: { name: "Alejandro Prieto", email: "alejandro@crystalcar.co" },
      team: [
        { name: "Paula Benitez", email: "paula@crystalcar.co", role: "ADMIN" as const },
      ],
    },
  ];

  const serviceTemplates = [
    { name: "Lavado Basico", description: "Lavado exterior con agua y jabon", price: 80.0, duration: 30 },
    { name: "Lavado Completo", description: "Lavado exterior e interior", price: 150.0, duration: 60 },
    { name: "Lavado Premium", description: "Lavado completo + encerado + aspirado", price: 250.0, duration: 90 },
    { name: "Detailing Exterior", description: "Pulido, encerado y proteccion de pintura", price: 500.0, duration: 180 },
    { name: "Detailing Interior", description: "Limpieza profunda de interiores, tapiceria y tablero", price: 450.0, duration: 150 },
    { name: "Detailing Completo", description: "Detailing exterior e interior completo", price: 850.0, duration: 300 },
    { name: "Lavado de Motor", description: "Limpieza y desengrasado del motor", price: 200.0, duration: 45 },
  ];

  const clientsData = [
    { firstName: "Juan", lastName: "Garcia", phone: "3001111111", email: "juan.garcia@email.com" },
    { firstName: "Maria", lastName: "Rodriguez", phone: "3002222222", email: "maria.rodriguez@email.com", isFrequent: true },
    { firstName: "Pedro", lastName: "Martinez", phone: "3003333333", email: "pedro.martinez@email.com" },
    { firstName: "Ana", lastName: "Lopez", phone: "3004444444", email: "ana.lopez@email.com", isFrequent: true },
    { firstName: "Carlos", lastName: "Hernandez", phone: "3005555555", email: "carlos.hernandez@email.com" },
    { firstName: "Laura", lastName: "Gonzalez", phone: "3006666666", email: "laura.gonzalez@email.com", isFrequent: true },
    { firstName: "Diego", lastName: "Ramirez", phone: "3007777777", email: "diego.ramirez@email.com" },
    { firstName: "Sofia", lastName: "Torres", phone: "3008888888", email: "sofia.torres@email.com" },
    { firstName: "Andres", lastName: "Morales", phone: "3009999999", email: "andres.morales@email.com", isFrequent: true },
    { firstName: "Camila", lastName: "Vargas", phone: "3010000000", email: "camila.vargas@email.com" },
    { firstName: "Santiago", lastName: "Castillo", phone: "3011111111", email: "santiago.castillo@email.com" },
    { firstName: "Valentina", lastName: "Ruiz", phone: "3012222222", email: "valentina.ruiz@email.com", isFrequent: true },
  ];

  const vehiclesData = [
    { plate: "ABC123", brand: "Toyota", model: "Corolla", year: 2022, color: "Blanco", vehicleType: "SEDAN" as const },
    { plate: "DEF456", brand: "Chevrolet", model: "Tracker", year: 2023, color: "Gris", vehicleType: "SUV" as const },
    { plate: "GHI789", brand: "Mazda", model: "CX-5", year: 2021, color: "Rojo", vehicleType: "SUV" as const },
    { plate: "JKL012", brand: "Renault", model: "Duster", year: 2020, color: "Negro", vehicleType: "SUV" as const },
    { plate: "MNO345", brand: "Kia", model: "Sportage", year: 2023, color: "Azul", vehicleType: "SUV" as const },
    { plate: "PQR678", brand: "Nissan", model: "Sentra", year: 2021, color: "Plata", vehicleType: "SEDAN" as const },
    { plate: "STU901", brand: "Ford", model: "Ranger", year: 2022, color: "Negro", vehicleType: "TRUCK" as const },
    { plate: "VWX234", brand: "Honda", model: "Civic", year: 2023, color: "Blanco", vehicleType: "SEDAN" as const },
    { plate: "YZA567", brand: "BMW", model: "X3", year: 2022, color: "Gris", vehicleType: "SUV" as const },
    { plate: "BCD890", brand: "Mercedes", model: "GLC", year: 2023, color: "Negro", vehicleType: "SUV" as const },
    { plate: "EFG123", brand: "Hyundai", model: "Tucson", year: 2021, color: "Azul", vehicleType: "SUV" as const },
    { plate: "HIJ456", brand: "Yamaha", model: "MT-07", year: 2022, color: "Azul", vehicleType: "MOTORCYCLE" as const },
  ];

  const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

  // =============================================
  // 4. Create each tenant with full data
  // =============================================
  for (let t = 0; t < tenantsData.length; t++) {
    const td = tenantsData[t];
    console.log(`\nCreando tenant: ${td.name} (${td.slug})...`);

    // Create tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: td.slug },
      update: {},
      create: {
        name: td.name,
        slug: td.slug,
        email: td.email,
        phone: td.phone,
        address: td.address,
        ...(td.planId ? { plan: { connect: { id: td.planId } } } : {}),
        trialEndsAt: td.trialEndsAt || null,
      },
    });

    // Create owner
    const owner = await prisma.user.upsert({
      where: { email: td.owner.email },
      update: {},
      create: {
        name: td.owner.name,
        email: td.owner.email,
        password: hashedPassword,
        globalRole: "USER",
      },
    });

    await prisma.tenantUser.upsert({
      where: { userId_tenantId: { userId: owner.id, tenantId: tenant.id } },
      update: { role: "OWNER" },
      create: { user: { connect: { id: owner.id } }, tenant: { connect: { id: tenant.id } }, role: "OWNER" },
    });

    // Create team members
    for (const member of td.team) {
      const user = await prisma.user.upsert({
        where: { email: member.email },
        update: {},
        create: {
          name: member.name,
          email: member.email,
          password: hashedPassword,
          globalRole: "USER",
        },
      });

      await prisma.tenantUser.upsert({
        where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
        update: { role: member.role },
        create: { user: { connect: { id: user.id } }, tenant: { connect: { id: tenant.id } }, role: member.role },
      });
    }

    // Create services
    const createdServices = [];
    for (const svc of serviceTemplates) {
      const service = await prisma.serviceType.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: svc.name } },
        update: {},
        create: { ...svc, tenant: { connect: { id: tenant.id } } },
      });
      createdServices.push(service);
    }

    // Create clients (use subset based on tenant index)
    const clientCount = Math.min(4 + t * 2, clientsData.length);
    const tenantClients = clientsData.slice(0, clientCount);
    const createdClients = [];

    for (const cd of tenantClients) {
      const uniqueEmail = cd.email ? `${td.slug}-${cd.email}` : null;
      const client = await prisma.client.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: uniqueEmail || "" } },
        update: {},
        create: {
          firstName: cd.firstName,
          lastName: cd.lastName,
          phone: cd.phone,
          email: uniqueEmail,
          isFrequent: cd.isFrequent || false,
          tenant: { connect: { id: tenant.id } },
        },
      });
      createdClients.push(client);
    }

    // Create vehicles for each client
    const createdVehicles = [];
    for (let c = 0; c < createdClients.length; c++) {
      const vd = vehiclesData[c % vehiclesData.length];
      const uniquePlate = `${vd.plate}-${td.slug.substring(0, 3).toUpperCase()}`;
      const vehicle = await prisma.vehicle.upsert({
        where: { tenantId_plate: { tenantId: tenant.id, plate: uniquePlate } },
        update: {},
        create: {
          plate: uniquePlate,
          brand: vd.brand,
          model: vd.model,
          year: vd.year,
          color: vd.color,
          vehicleType: vd.vehicleType,
          client: { connect: { id: createdClients[c].id } },
          tenant: { connect: { id: tenant.id } },
        },
      });
      createdVehicles.push(vehicle);
    }

    // Create orders
    const orderCount = 5 + t * 3;
    let orderCounter = 1;

    for (let o = 0; o < orderCount; o++) {
      const clientIdx = o % createdClients.length;
      const vehicleIdx = o % createdVehicles.length;
      const serviceIdx = o % createdServices.length;
      const statusIdx = o % statuses.length;
      const status = statuses[statusIdx];

      const service = createdServices[serviceIdx];
      const quantity = 1 + (o % 2);
      const unitPrice = Number(service.price);
      const subtotal = unitPrice * quantity;

      const daysAgo = Math.floor(o * 2.5);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const startedAt = status !== "PENDING" ? new Date(createdAt.getTime() + 30 * 60 * 1000) : null;
      const completedAt = status === "COMPLETED" ? new Date(createdAt.getTime() + service.duration * 60 * 1000) : null;

      const orderNumber = `ORD-${td.slug.substring(0, 3).toUpperCase()}-${String(orderCounter++).padStart(4, "0")}`;

      // Check if order already exists
      const existing = await prisma.serviceOrder.findUnique({
        where: { tenantId_orderNumber: { tenantId: tenant.id, orderNumber } },
      });

      if (!existing) {
        await prisma.serviceOrder.create({
          data: {
            orderNumber,
            status,
            totalAmount: subtotal,
            notes: o % 3 === 0 ? "Cliente solicito cuidado especial con la pintura" : null,
            startedAt,
            completedAt,
            createdAt,
            tenant: { connect: { id: tenant.id } },
            client: { connect: { id: createdClients[clientIdx].id } },
            vehicle: { connect: { id: createdVehicles[vehicleIdx].id } },
            createdBy: { connect: { id: owner.id } },
            items: {
              create: [
                {
                  quantity,
                  unitPrice: service.price,
                  subtotal,
                  serviceType: { connect: { id: service.id } },
                },
              ],
            },
          },
        });
      }
    }

    console.log(`  -> ${td.team.length + 1} usuarios, ${createdClients.length} clientes, ${createdVehicles.length} vehiculos, ${orderCount} ordenes`);
  }

  // =============================================
  // Summary
  // =============================================
  console.log("\n================================");
  console.log("Seed completado exitosamente");
  console.log("================================");
  console.log("\nCredenciales de acceso:");
  console.log("  Super Admin: superadmin@carwash.com / superadmin123");
  console.log("  Password general tenants: password123");
  console.log("\nTenants creados:");
  for (const td of tenantsData) {
    console.log(`  - ${td.name}: ${td.slug}.localhost:3000 (Owner: ${td.owner.email})`);
  }
  console.log("\nPara acceder a un tenant, usa el subdominio:");
  console.log("  http://demo.localhost:3000/dashboard");
  console.log("  http://aqua-shine.localhost:3000/dashboard");
  console.log("  http://clean-express.localhost:3000/dashboard");
  console.log("  etc.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
