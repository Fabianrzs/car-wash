import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/http/errors";

export async function requireAuth() {
  const session = await auth();

  if (!session) {
    throw new UnauthorizedError();
  }

  return session;
}

