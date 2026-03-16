/**
 * Shared validation schemas and composables
 * Reduces duplication of Zod schemas across modules
 */

import { z } from "zod";

/**
 * Shared string field validations
 */
export const stringField = z.string().trim().min(1, "Campo requerido");
export const optionalStringField = z.string().trim().optional().nullable();
export const emailField = z.string().email("Email inválido");
export const phoneField = z.string().regex(/^[\d+\-\s()]*$/, "Teléfono inválido");

/**
 * Shared ID fields
 */
export const idField = z.string().uuid("ID inválido");
export const optionalIdField = idField.optional();

/**
 * Shared numeric fields
 */
export const positiveNumber = z.number().positive("Debe ser mayor a 0");
export const nonNegativeNumber = z.number().nonnegative("No puede ser negativo");
export const optionalPositiveNumber = positiveNumber.optional();
export const optionalNonNegativeNumber = nonNegativeNumber.optional();

/**
 * Shared year validation
 */
export const yearField = z
  .number()
  .int()
  .min(1900, "Año inválido")
  .max(new Date().getFullYear() + 1, "Año no puede ser futuro");
export const optionalYearField = yearField.optional().nullable();

/**
 * Vehicle-specific validations
 */
export const vehicleTypeField = z.enum([
  "SEDAN",
  "SUV",
  "PICKUP",
  "VAN",
  "HATCHBACK",
  "COUPE",
  "MOTORCYCLE",
  "TRUCK",
]);

export const plateField = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9\-]{3,10}$/, "Placa inválida");

export const brandField = stringField.min(2, "Marca debe tener al menos 2 caracteres");
export const modelField = stringField.min(2, "Modelo debe tener al menos 2 caracteres");

/**
 * Shared query parameters
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const searchQuerySchema = z.object({
  search: optionalStringField,
});

export const commonQuerySchema = paginationQuerySchema.merge(searchQuerySchema);

/**
 * Status fields
 */
export const booleanField = z.boolean().default(false);
export const booleanQueryValue = z
  .enum(["true", "false"])
  .transform((val) => val === "true")
  .or(z.boolean())
  .default(false);

/**
 * Shared payload builders
 */
export interface ClientPayload {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  address?: string | null;
  notes?: string | null;
  isFrequent?: boolean;
}

export interface VehiclePayload {
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  color?: string | null;
  vehicleType: string;
}

export interface ServicePayload {
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
}

