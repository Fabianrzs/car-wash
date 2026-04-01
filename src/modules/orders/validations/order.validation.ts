import { z } from "zod";

const ORDER_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export const orderItemSchema = z.object({
  serviceTypeId: z.string().trim().min(1, "El servicio es requerido"),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0").default(1),
  unitPrice: z.coerce.number().nonnegative().default(0),
  subtotal: z.coerce.number().nonnegative().default(0),
});

export const orderSchema = z.object({
  clientId: z.string().trim().min(1, "El cliente es requerido"),
  vehicleId: z.string().trim().min(1, "El vehiculo es requerido"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  assignedToId: z.string().trim().optional().nullable(),
  items: z.array(orderItemSchema).min(1, "Debe agregar al menos un servicio"),
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const orderIdParamsSchema = z.object({
  id: z.string().trim().min(1, "El id de la orden es requerido"),
});

export const updateOrderNotesSchema = z.object({
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const orderAssignmentSchema = z.object({
  assignedToId: z.string().trim().min(1).nullable().optional(),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(ORDER_STATUSES).optional(),
  search: z.string().trim().default(""),
  clientId: z.string().trim().optional(),
  assignedToMe: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  unassigned: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  board: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
export type UpdateOrderNotesInput = z.infer<typeof updateOrderNotesSchema>;
export type OrderAssignmentInput = z.infer<typeof orderAssignmentSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

