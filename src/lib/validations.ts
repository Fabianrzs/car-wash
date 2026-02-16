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
  businessName: z.string().min(2, "El nombre del lavadero debe tener al menos 2 caracteres").max(200),
  businessSlug: z.string().min(3, "El slug debe tener al menos 3 caracteres").max(100)
    .regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minusculas, numeros y guiones"),
  planSlug: z.string().optional(),
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
// TENANT SCHEMAS
// =============================================

export const tenantSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  slug: z.string().min(3, "El slug debe tener al menos 3 caracteres").max(100)
    .regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minusculas, numeros y guiones"),
  email: z.string().email("Email invalido").max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  logoUrl: z.string().url("URL invalida").optional().or(z.literal("")),
});

export const tenantSettingsSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Email invalido").max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  logoUrl: z.string().url("URL invalida").optional().or(z.literal("")),
});

export const planSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  slug: z.string().min(2, "El slug debe tener al menos 2 caracteres").max(50)
    .regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minusculas, numeros y guiones"),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z.coerce.number().nonnegative("El precio debe ser mayor o igual a 0"),
  interval: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  maxUsers: z.coerce.number().int().positive().default(5),
  maxOrdersPerMonth: z.coerce.number().int().positive().default(500),
  stripePriceId: z.string().optional().or(z.literal("")),
  features: z.array(z.string()).default([]),
});

export const invitationSchema = z.object({
  email: z.string().email("Email invalido"),
  role: z.enum(["ADMIN", "EMPLOYEE"]).default("EMPLOYEE"),
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
export type TenantInput = z.infer<typeof tenantSchema>;
export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>;
export type PlanInput = z.infer<typeof planSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
