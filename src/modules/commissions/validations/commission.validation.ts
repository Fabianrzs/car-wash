import { z } from "zod";

export const createPayoutSchema = z.object({
  userId: z.string().min(1, "ID de lavador requerido"),
  earningIds: z.array(z.string().min(1)).min(1, "Debe seleccionar al menos una ganancia"),
  notes: z.string().max(500).optional(),
});

export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
