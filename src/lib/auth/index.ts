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
            try {
                if (user) {
                    token.id = user.id ?? token.id;
                    token.globalRole = user.globalRole ?? token.globalRole;
                    token.tenantSlug = user.tenantSlug;
                }
                return token;
            } catch (error) {
                console.error("[auth] jwt callback error:", error);
                return token;
            }
        },

        async session({ session, token }) {
            try {
                if (token?.id) {
                    session.user.id = token.id as string;
                }
                if (token?.globalRole) {
                    session.user.globalRole = token.globalRole as string;
                }
                if (token?.tenantSlug) {
                    session.user.tenantSlug = token.tenantSlug as string;
                }
                return session;
            } catch (error) {
                console.error("[auth] session callback error:", error);
                return session;
            }
        },
    },

    ...authConfig,
});

