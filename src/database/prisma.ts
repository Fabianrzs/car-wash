import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

// Determina si está en producción/Vercel
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

// Crea opciones de conexión con SSL para Supabase
const adapterOptions: ConstructorParameters<typeof PrismaPg>[0] = {
    connectionString,
};

// En Vercel/producción, asegura que SSL esté habilitado
if (isProduction && !connectionString.includes("sslmode")) {
    // Si no tiene sslmode en la URL, usa opciones directas
    adapterOptions.ssl = {
        rejectUnauthorized: false,
    };
}

const adapter = new PrismaPg(adapterOptions);

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}