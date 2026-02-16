import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@carwash.com" },
    update: {},
    create: {
      email: "admin@carwash.com",
      name: "Administrador",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const services = [
    { name: "Lavado Basico", description: "Lavado exterior con agua y jabon", price: 80.0, duration: 30 },
    { name: "Lavado Completo", description: "Lavado exterior e interior", price: 150.0, duration: 60 },
    { name: "Lavado Premium", description: "Lavado completo + encerado + aspirado", price: 250.0, duration: 90 },
    { name: "Detailing Exterior", description: "Pulido, encerado y proteccion de pintura", price: 500.0, duration: 180 },
    { name: "Detailing Interior", description: "Limpieza profunda de interiores, tapiceria y tablero", price: 450.0, duration: 150 },
    { name: "Detailing Completo", description: "Detailing exterior e interior completo", price: 850.0, duration: 300 },
    { name: "Lavado de Motor", description: "Limpieza y desengrasado del motor", price: 200.0, duration: 45 },
  ];

  for (const service of services) {
    await prisma.serviceType.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
  }

  console.log("Seed completado exitosamente");
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
