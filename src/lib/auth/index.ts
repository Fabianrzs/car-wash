import NextAuth from "next-auth";
import authConfig from "@/lib/auth/config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/database/prisma";

const isProduction = process.env.NODE_ENV === "production";

const sessionCookieName = isProduction
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),

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

