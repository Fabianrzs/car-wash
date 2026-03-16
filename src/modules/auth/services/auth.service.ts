import { authRepository } from "@/modules/auth/repositories/auth.repository";

const RESERVED_SLUGS = ["admin", "api", "app", "www", "mail", "ftp", "blog", "help", "support"];

export async function isSlugAvailable(slug: string): Promise<{ available: boolean; reason: string | null }> {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { available: false, reason: "Formato inválido" };
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return { available: false, reason: "Slug reservado" };
  }
  const existing = await authRepository.findTenantBySlug({ where: { slug } });
  return { available: !existing, reason: existing ? "Ya está en uso" : null };
}

export async function isEmailTaken(email: string): Promise<boolean> {
  const user = await authRepository.findUserByEmail({ where: { email } });
  return !!user;
}

