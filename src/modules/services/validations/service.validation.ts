import { z } from "zod";

const optionalStringField = z.string().trim().optional().or(z.literal(""));
const booleanQueryValue = z.enum(["true", "false"]).transform(
  (value) => value === "true"
);

export const serviceTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
  description: optionalStringField,
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  duration: z.coerce.number().int().positive("La duracion debe ser mayor a 0"),
  isActive: z.boolean().default(true),
});

export const serviceIdParamsSchema = z.object({
  id: z.string().trim().min(1, "El id del servicio es requerido"),
});

export const listServicesQuerySchema = z.object({
  active: booleanQueryValue.optional(),
});

export type ServiceTypeInput = z.infer<typeof serviceTypeSchema>;
export type ServiceIdParams = z.infer<typeof serviceIdParamsSchema>;
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;

