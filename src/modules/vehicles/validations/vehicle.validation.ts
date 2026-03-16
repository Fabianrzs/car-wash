import { z } from "zod";

const optionalStringField = z.string().trim().optional().or(z.literal(""));

export const vehicleSchema = z.object({
  plate: z.string().trim().min(2, "La placa es requerida").max(15),
  brand: z.string().trim().min(1, "La marca es requerida").max(50),
  model: z.string().trim().min(1, "El modelo es requerido").max(50),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  color: optionalStringField,
  vehicleType: z
    .enum(["SEDAN", "SUV", "TRUCK", "MOTORCYCLE", "VAN", "OTHER"])
    .default("SEDAN"),
  clientIds: z.array(z.string().trim().min(1)).min(1, "Al menos un cliente es requerido"),
});

export const vehicleIdParamsSchema = z.object({
  id: z.string().trim().min(1, "El id del vehiculo es requerido"),
});

export const listVehiclesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().default(""),
  clientId: z.string().trim().optional().default(""),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const vehicleClientBodySchema = z.object({
  clientId: z.string().trim().min(1, "clientId es requerido"),
});

export const vehicleClientQuerySchema = z.object({
  clientId: z.string().trim().min(1, "clientId es requerido"),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type VehicleIdParams = z.infer<typeof vehicleIdParamsSchema>;
export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;
export type VehicleClientBody = z.infer<typeof vehicleClientBodySchema>;
export type VehicleClientQuery = z.infer<typeof vehicleClientQuerySchema>;

