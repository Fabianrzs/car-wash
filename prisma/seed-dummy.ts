import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const firstNames = ["Carlos", "Maria", "Luis", "Ana", "Pedro", "Laura", "Jorge", "Sofia", "Diego", "Valentina", "Andres", "Camila", "Ricardo", "Isabella", "Fernando"];
const lastNames = ["Garcia", "Rodriguez", "Martinez", "Lopez", "Hernandez", "Gonzalez", "Perez", "Sanchez", "Ramirez", "Torres", "Flores", "Rivera", "Gomez", "Diaz", "Morales"];
const brands = ["Toyota", "Chevrolet", "Ford", "Mazda", "Nissan", "Hyundai", "Kia", "Renault", "Volkswagen", "Honda"];
const models: Record<string, string[]> = {
  Toyota: ["Corolla", "Hilux", "RAV4", "Prado"],
  Chevrolet: ["Spark", "Onix", "Tracker", "Captiva"],
  Ford: ["Fiesta", "Focus", "Escape", "Ranger"],
  Mazda: ["3", "CX-5", "CX-30", "2"],
  Nissan: ["Versa", "Sentra", "Kicks", "X-Trail"],
  Hyundai: ["Accent", "Tucson", "Creta", "i10"],
  Kia: ["Picanto", "Rio", "Sportage", "Seltos"],
  Renault: ["Logan", "Sandero", "Duster", "Kwid"],
  Volkswagen: ["Gol", "Polo", "T-Cross", "Tiguan"],
  Honda: ["Civic", "CR-V", "HR-V", "Fit"],
};
const colors = ["Blanco", "Negro", "Gris", "Rojo", "Azul", "Plata", "Verde"];
const vehicleTypes = ["SEDAN", "SUV", "TRUCK", "MOTORCYCLE", "VAN"] as const;

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPlate(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return `${randomItem([...letters])}${randomItem([...letters])}${randomItem([...letters])}${Math.floor(100 + Math.random() * 900)}`;
}

function randomPhone(): string {
  return `3${Math.floor(100000000 + Math.random() * 899999999)}`;
}

function randomDate(daysBack: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function main() {
  console.log("Generando datos dummy...");

  // Get admin user and services
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("No admin user found. Run the main seed first.");

  const services = await prisma.serviceType.findMany({ where: { isActive: true } });
  if (services.length === 0) throw new Error("No services found. Run the main seed first.");

  // Create 15 clients
  const clientIds: string[] = [];
  for (let i = 0; i < 15; i++) {
    const client = await prisma.client.create({
      data: {
        firstName: firstNames[i],
        lastName: randomItem(lastNames),
        phone: randomPhone(),
        email: `${firstNames[i].toLowerCase()}${i}@email.com`,
        isFrequent: Math.random() > 0.6,
        createdAt: randomDate(60),
      },
    });
    clientIds.push(client.id);
    console.log(`  Cliente: ${client.firstName} ${client.lastName}`);
  }

  // Create 1-3 vehicles per client
  const vehicleIds: Map<string, string[]> = new Map();
  for (const clientId of clientIds) {
    const numVehicles = 1 + Math.floor(Math.random() * 3);
    const vIds: string[] = [];
    for (let j = 0; j < numVehicles; j++) {
      const brand = randomItem(brands);
      const vehicle = await prisma.vehicle.create({
        data: {
          plate: randomPlate(),
          brand,
          model: randomItem(models[brand]),
          year: 2015 + Math.floor(Math.random() * 11),
          color: randomItem(colors),
          vehicleType: randomItem([...vehicleTypes]),
          clientId,
        },
      });
      vIds.push(vehicle.id);
    }
    vehicleIds.set(clientId, vIds);
  }
  console.log(`  Vehiculos creados: ${[...vehicleIds.values()].flat().length}`);

  // Create 40 orders spread across the last 30 days
  let orderCount = 0;
  for (let i = 0; i < 40; i++) {
    const clientId = randomItem(clientIds);
    const clientVehicles = vehicleIds.get(clientId)!;
    const vehicleId = randomItem(clientVehicles);
    const orderDate = randomDate(30);

    // Pick 1-3 random services
    const numServices = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...services].sort(() => Math.random() - 0.5);
    const selectedServices = shuffled.slice(0, numServices);

    let totalAmount = 0;
    const orderItems = selectedServices.map((svc) => {
      const qty = 1;
      const unitPrice = Number(svc.price);
      const subtotal = unitPrice * qty;
      totalAmount += subtotal;
      return {
        serviceTypeId: svc.id,
        quantity: qty,
        unitPrice,
        subtotal,
      };
    });

    // Random status: 60% completed, 20% in_progress, 15% pending, 5% cancelled
    const rand = Math.random();
    let status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    let startedAt: Date | null = null;
    let completedAt: Date | null = null;

    if (rand < 0.6) {
      status = "COMPLETED";
      startedAt = new Date(orderDate.getTime() + 10 * 60000);
      completedAt = new Date(startedAt.getTime() + 60 * 60000);
    } else if (rand < 0.8) {
      status = "IN_PROGRESS";
      startedAt = new Date(orderDate.getTime() + 10 * 60000);
    } else if (rand < 0.95) {
      status = "PENDING";
    } else {
      status = "CANCELLED";
    }

    // Generate order number
    const dateStr = orderDate.toISOString().split("T")[0].replace(/-/g, "");
    const orderNumber = `ORD-${dateStr}-${String(i + 10).padStart(3, "0")}`;

    await prisma.serviceOrder.create({
      data: {
        orderNumber,
        status,
        totalAmount,
        startedAt,
        completedAt,
        createdAt: orderDate,
        updatedAt: orderDate,
        clientId,
        vehicleId,
        createdById: admin.id,
        items: { create: orderItems },
      },
    });
    orderCount++;
  }

  console.log(`  Ordenes creadas: ${orderCount}`);
  console.log("Datos dummy generados exitosamente!");
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
