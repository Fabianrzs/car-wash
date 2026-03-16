import { prisma } from "@/database/prisma";
import { runTransaction } from "@/database/transaction-manager";

export {prisma, runTransaction};