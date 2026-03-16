// Public API exports for auth module
export { AuthModuleError, handleAuthHttpError } from "@/modules/auth/auth.errors";
export { registerSchema, registerInviteSchema, checkSlugQuerySchema } from "@/modules/auth/validations/auth.validation";
export type { RegisterInput, RegisterInviteInput, CheckSlugQuery } from "@/modules/auth/validations/auth.validation";
export { isSlugAvailable, isEmailTaken } from "@/modules/auth/services/auth.service";
export { registerUserService, registerInviteUserService } from "@/modules/auth/services/register.service";

