import { z } from "zod";

// =============================================
// AUTH SCHEMAS
// =============================================

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contrasenas no coinciden",
  path: ["confirmPassword"],
});

// =============================================
// CLIENT SCHEMAS
// =============================================

export const clientSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Email invalido").max(255).optional().or(z.literal("")),
  phone: z.string().min(7, "El telefono debe tener al menos 7 caracteres").max(20),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  isFrequent: z.boolean().default(false),
});

// =============================================
// VEHICLE SCHEMAS
// =============================================

export const vehicleSchema = z.object({
  plate: z.string().min(2, "La placa es requerida").max(15),
  brand: z.string().min(1, "La marca es requerida").max(50),
  model: z.string().min(1, "El modelo es requerido").max(50),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  color: z.string().max(30).optional().or(z.literal("")),
  vehicleType: z.enum(["SEDAN", "SUV", "TRUCK", "MOTORCYCLE", "VAN", "OTHER"]).default("SEDAN"),
  clientId: z.string().min(1, "El cliente es requerido"),
});

// =============================================
// SERVICE TYPE SCHEMAS
// =============================================

export const serviceTypeSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  duration: z.coerce.number().int().positive("La duracion debe ser mayor a 0"),
  isActive: z.boolean().default(true),
});

// =============================================
// ORDER SCHEMAS
// =============================================

export const orderItemSchema = z.object({
  serviceTypeId: z.string().min(1, "El servicio es requerido"),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0").default(1),
  unitPrice: z.coerce.number().nonnegative().default(0),
  subtotal: z.coerce.number().nonnegative().default(0),
});

export const orderSchema = z.object({
  clientId: z.string().min(1, "El cliente es requerido"),
  vehicleId: z.string().min(1, "El vehiculo es requerido"),
  notes: z.string().max(1000).optional().or(z.literal("")),
  items: z.array(orderItemSchema).min(1, "Debe agregar al menos un servicio"),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

// =============================================
// INFERRED TYPES
// =============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type ServiceTypeInput = z.infer<typeof serviceTypeSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
