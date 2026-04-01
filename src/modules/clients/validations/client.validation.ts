import { z } from "zod";

const optionalStringField = z.string().trim().optional().or(z.literal(""));
const booleanQueryValue = z.enum(["true", "false"]).transform(
  (value) => value === "true"
);

export const clientVehicleSchema = z.object({
  plate: z.string().trim().min(2).max(15),
  brand: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(50),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  color: optionalStringField,
  vehicleType: z
    .enum(["SEDAN", "SUV", "TRUCK", "MOTORCYCLE", "VAN", "OTHER"])
    .default("SEDAN"),
});

export const clientSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
  lastName: z
    .string()
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(100),
  email: optionalStringField.pipe(
    z.union([z.string().email("Email invalido").max(255), z.literal("")])
  ).optional(),
  phone: z
    .string()
    .trim()
    .min(7, "El telefono debe tener al menos 7 caracteres")
    .max(20),
  address: optionalStringField,
  notes: optionalStringField,
  isFrequent: z.boolean().default(false),
  vehicle: clientVehicleSchema.optional(),
});

export const clientIdParamsSchema = z.object({
  id: z.string().trim().min(1, "El id del cliente es requerido"),
});

export const listClientsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    search: z.string().trim().default(""),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    frequent: booleanQueryValue.optional(),
    isFrequent: booleanQueryValue.optional(),
  })
  .transform(({ frequent, isFrequent, ...query }) => ({
    ...query,
    isFrequent: isFrequent ?? frequent,
  }));

export const clientHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export type CreateClientInput = z.infer<typeof clientSchema>;
export type UpdateClientInput = z.infer<typeof clientSchema>;
export type ClientIdParams = z.infer<typeof clientIdParamsSchema>;
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
export type ClientHistoryQuery = z.infer<typeof clientHistoryQuerySchema>;

