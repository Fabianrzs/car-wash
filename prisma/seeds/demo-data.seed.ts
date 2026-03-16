import { PrismaClient } from "@/generated/prisma/client";

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

const orderStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export async function seedDemoData(
  prisma: PrismaClient,
  tenants: { id: string; slug: string; ownerId: string }[]
) {
  console.log("\nCreando datos demo (servicios, clientes, vehiculos, ordenes)...");

  for (let t = 0; t < tenants.length; t++) {
    const { id: tenantId, slug, ownerId } = tenants[t];

    // Services
    const createdServices = [];
    for (const svc of serviceTemplates) {
      const service = await prisma.serviceType.upsert({
        where: { tenantId_name: { tenantId, name: svc.name } },
        update: {},
        create: { ...svc, tenant: { connect: { id: tenantId } } },
      });
      createdServices.push(service);
    }

    // Clients
    const clientCount = Math.min(4 + t * 2, clientsData.length);
    const createdClients = [];
    for (const cd of clientsData.slice(0, clientCount)) {
      const uniqueEmail = `${slug}-${cd.email}`;
      const client = await prisma.client.upsert({
        where: { tenantId_email: { tenantId, email: uniqueEmail } },
        update: {},
        create: {
          firstName: cd.firstName,
          lastName: cd.lastName,
          phone: cd.phone,
          email: uniqueEmail,
          isFrequent: cd.isFrequent ?? false,
          tenant: { connect: { id: tenantId } },
        },
      });
      createdClients.push(client);
    }

    // Vehicles — one per client, associated via ClientVehicle
    const createdVehicles = [];
    for (let i = 0; i < createdClients.length; i++) {
      const vd = vehiclesData[i % vehiclesData.length];
      const uniquePlate = `${vd.plate}-${slug.substring(0, 3).toUpperCase()}`;

      const vehicle = await prisma.vehicle.upsert({
        where: { tenantId_plate: { tenantId, plate: uniquePlate } },
        update: {},
        create: {
          plate: uniquePlate,
          brand: vd.brand,
          model: vd.model,
          year: vd.year,
          color: vd.color,
          vehicleType: vd.vehicleType,
          tenant: { connect: { id: tenantId } },
        },
      });
      createdVehicles.push(vehicle);

      await prisma.clientVehicle.upsert({
        where: { clientId_vehicleId: { clientId: createdClients[i].id, vehicleId: vehicle.id } },
        update: {},
        create: { clientId: createdClients[i].id, vehicleId: vehicle.id, tenantId },
      });
    }

    // Many-to-many demo: first vehicle shared with second client
    if (t === 0 && createdClients.length >= 2 && createdVehicles.length >= 1) {
      await prisma.clientVehicle.upsert({
        where: { clientId_vehicleId: { clientId: createdClients[1].id, vehicleId: createdVehicles[0].id } },
        update: {},
        create: { clientId: createdClients[1].id, vehicleId: createdVehicles[0].id, tenantId },
      });
    }

    // Orders
    const orderCount = 5 + t * 3;
    let orderCounter = 1;

    for (let o = 0; o < orderCount; o++) {
      const clientIdx = o % createdClients.length;
      const service = createdServices[o % createdServices.length];
      const status = orderStatuses[o % orderStatuses.length];
      const quantity = 1 + (o % 2);
      const subtotal = Number(service.price) * quantity;
      const daysAgo = Math.floor(o * 2.5);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const startedAt = status !== "PENDING" ? new Date(createdAt.getTime() + 30 * 60 * 1000) : null;
      const completedAt = status === "COMPLETED" ? new Date(createdAt.getTime() + service.duration * 60 * 1000) : null;
      const orderNumber = `ORD-${slug.substring(0, 3).toUpperCase()}-${String(orderCounter++).padStart(4, "0")}`;

      const existing = await prisma.serviceOrder.findUnique({
        where: { tenantId_orderNumber: { tenantId, orderNumber } },
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
            tenant: { connect: { id: tenantId } },
            client: { connect: { id: createdClients[clientIdx].id } },
            vehicle: { connect: { id: createdVehicles[clientIdx].id } },
            createdBy: { connect: { id: ownerId } },
            items: {
              create: [{ quantity, unitPrice: service.price, subtotal, serviceType: { connect: { id: service.id } } }],
            },
          },
        });
      }
    }

    console.log(`  -> ${slug}: ${createdClients.length} clientes, ${createdVehicles.length} vehiculos, ${orderCount} ordenes`);
  }
}
