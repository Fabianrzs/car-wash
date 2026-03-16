import { z } from "zod";

export const tenantSettingsSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Email inválido").max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

export const inviteTeamMemberSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "EMPLOYEE"]).default("EMPLOYEE"),
});

export const updateTeamMemberRoleSchema = z.object({
  tenantUserId: z.string().min(1, "ID requerido"),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
});

export const changePlanSchema = z.object({
  action: z.enum(["portal", "change-plan"]),
  planId: z.string().nullable().optional(),
});

export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>;
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
export type UpdateTeamMemberRoleInput = z.infer<typeof updateTeamMemberRoleSchema>;
export type ChangePlanInput = z.infer<typeof changePlanSchema>;

