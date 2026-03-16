import { z } from "zod";

const intervalSchema = z.enum(["MONTHLY", "YEARLY"]);

export const planIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const createPlanSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  interval: intervalSchema.default("MONTHLY"),
  maxUsers: z.coerce.number().int().positive().default(5),
  maxOrdersPerMonth: z.coerce.number().int().positive().default(500),
  stripePriceId: z.string().trim().optional().nullable(),
  features: z.array(z.string()).default([]),
});

export const updatePlanSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  price: z.coerce.number().nonnegative().optional(),
  interval: intervalSchema.optional(),
  maxUsers: z.coerce.number().int().positive().optional(),
  maxOrdersPerMonth: z.coerce.number().int().positive().optional(),
  stripePriceId: z.string().trim().optional().nullable(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

