import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6),
  businessName: z.string().min(2).max(200),
  businessSlug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  planSlug: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const registerInviteSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  token: z.string().min(1, "Token requerido"),
});

export const checkSlugQuerySchema = z.object({
  slug: z.string().min(1, "Slug requerido"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterInviteInput = z.infer<typeof registerInviteSchema>;
export type CheckSlugQuery = z.infer<typeof checkSlugQuerySchema>;

