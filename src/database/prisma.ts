import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
};

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

// Asegurar que sslmode esté presente para Supabase
if (!connectionString.includes("sslmode")) {
    const separator = connectionString.includes("?") ? "&" : "?";
    connectionString = `${connectionString}${separator}sslmode=require`;
}

const adapter = new PrismaPg({
    connectionString,
    max: 1,
});

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
    });

globalForPrisma.prisma = prisma;