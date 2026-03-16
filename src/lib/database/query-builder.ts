/**
 * Generic repository utilities for consistent query patterns
 * Standardizes select/include patterns across modules
 */

import { Prisma } from "@/generated/prisma/client";

/**
 * Query profiles define standard select/include patterns
 * for different operation types
 */
export interface QueryProfile {
  list: Record<string, any>;
  detail: Record<string, any>;
  mutation?: Record<string, any>;
}

/**
 * Helper to safely get database instance
 * Works with both Prisma client and transaction context
 */
export function getDatabase<T extends { [key: string]: any }>(
  db: T
): T {
  if (!db) {
    throw new Error("Database instance is required");
  }
  return db;
}

/**
 * Type for database instance (Prisma or Transaction)
 */
export type DatabaseInstance = typeof import("@/database/prisma").prisma | Prisma.TransactionClient;

/**
 * Common count patterns
 */
export const commonCountPatterns = {
  simple: { select: { id: true } },
  withRelations: (relations: Record<string, any>) => ({
    select: { id: true, ...relations },
  }),
};

/**
 * Helper to build consistent list select
 */
export function buildListSelect<T extends Record<string, any>>(
  baseSelect: T,
  pagination?: { take?: number; skip?: number }
): T & { take?: number; skip?: number } {
  return {
    ...baseSelect,
    ...(pagination && { take: pagination.take, skip: pagination.skip }),
  };
}

/**
 * Helper to build consistent detail include
 */
export function buildDetailInclude<T extends Record<string, any>>(
  baseInclude: T
): { include: T } {
  return { include: baseInclude };
}

/**
 * Helper for Prisma where conditions
 */
export interface FindManyOptions<TWhereInput> {
  where?: TWhereInput;
  take?: number;
  skip?: number;
  orderBy?: Record<string, "asc" | "desc">;
  select?: Record<string, any>;
  include?: Record<string, any>;
}

/**
 * Helper for building where clauses with tenant context
 */
export function buildTenantWhere<T extends Record<string, any>>(
  tenantId: string,
  additionalWhere?: T
): T & { tenantId: string } {
  return {
    tenantId,
    ...additionalWhere,
  } as T & { tenantId: string };
}

