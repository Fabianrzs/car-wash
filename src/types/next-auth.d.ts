import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      globalRole: string;
      tenantSlug?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    globalRole?: string;
    tenantSlug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    globalRole?: string;
    tenantSlug?: string;
  }
}
