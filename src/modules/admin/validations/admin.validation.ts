import { z } from "zod";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().default(""),
});

export const listTenantsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().default(""),
});

export const listTenantOptionsQuerySchema = z.object({
  search: z.string().trim().default(""),
});

export const tenantIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const createTenantSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  planId: z.string().trim().optional().nullable(),
  ownerEmail: z.string().trim().email().optional().or(z.literal("")),
});

export const updateTenantSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  trialEndsAt: z.string().datetime().optional().nullable(),
  planId: z.string().trim().optional().nullable(),
});


