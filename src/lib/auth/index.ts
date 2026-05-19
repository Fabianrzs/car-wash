import NextAuth from "next-auth";
import authConfig from "@/lib/auth/config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/database/prisma";

const isProduction = process.env.NODE_ENV === "production";

const AUTH_SECRET = process.env.AUTH_SECRET;
const DEFAULT_SECRET = "car-wash-secret-key-change-in-production";

if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET no está definido. Genera uno con `openssl rand -base64 32`.");
}
if (isProduction && (AUTH_SECRET === DEFAULT_SECRET || AUTH_SECRET.length < 32)) {
    throw new Error(
        "AUTH_SECRET es el valor por defecto o es demasiado corto en producción. " +
        "Rota la clave con `openssl rand -base64 32` y actualiza el secreto en el host."
    );
}

// NextAuth v5 usa el prefijo `authjs.` por defecto (los otros cookies — csrf-token,
// callback-url — usan ese mismo prefijo). Forzar `next-auth.session-token` rompe en
// producción porque el SALT que NextAuth deriva internamente no coincide con el
// override del cookieName, y `getToken` no puede decodificar el JWE.
export const sessionCookieName = isProduction
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    secret: AUTH_SECRET,

    session: {
        strategy: "jwt",
    },

    cookies: {
        sessionToken: {
            name: sessionCookieName,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: isProduction,
            },
        },
    },

    pages: {
        signIn: "/login",
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.globalRole = user.globalRole;
                token.tenantSlug = user.tenantSlug;
            }
            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.globalRole = token.globalRole as string;
                session.user.tenantSlug = token.tenantSlug as string | undefined;
            }
            return session;
        },
    },

    ...authConfig,
});

