import { ForbiddenError } from "@/lib/http/errors";
import { requireAuth } from "@/middleware/auth.middleware";

export async function requireSuperAdmin() {
  const session = await requireAuth();

  if (session.user.globalRole !== "SUPER_ADMIN") {
    throw new ForbiddenError();
  }

  return session;
}

