import { z } from "zod";

const idSchema = z.string().trim().min(1);

export const flowIdParamsSchema = z.object({ id: idSchema });
export const flowStepParamsSchema = z.object({ id: idSchema, stepId: idSchema });

export const createFlowSchema = z.object({
  key: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
});

export const updateFlowSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createStepSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  target: z.string().trim().min(1),
  placement: z.string().trim().default("bottom"),
  order: z.number().int().optional(),
});

export const updateStepSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  target: z.string().trim().min(1).optional(),
  placement: z.string().trim().optional(),
  order: z.number().int().optional(),
});

export const updateFlowPlansSchema = z.object({
  planIds: z.array(z.string().trim().min(1)).default([]),
});

export const upsertFlowTenantOverrideSchema = z.object({
  tenantId: z.string().trim().min(1),
  isEnabled: z.boolean().optional(),
});

export const flowTenantDeleteQuerySchema = z.object({
  tenantId: z.string().trim().min(1),
});


