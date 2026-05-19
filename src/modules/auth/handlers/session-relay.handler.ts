import { NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";
import { getProtocol, getCookieDomain } from "@/lib/utils/domain";
import { sessionCookieName } from "@/lib/auth";

const COOKIE_NAME = sessionCookieName;
// Salt en NextAuth v5 deriva del nombre de la cookie. Si COOKIE_NAME cambia (dev ↔ prod), el salt debe seguirle.
const COOKIE_SALT = sessionCookieName;

/**
 * Session relay for cross-subdomain auth on localhost.
 *
 * Chromium does NOT share cookies between `localhost` and `demo.localhost`
 * even with `Domain=.localhost`. This endpoint bridges the gap:
 *
 * Flow:
 *   1. LoginForm redirects to `/api/auth/session-relay?callbackUrl=http://demo.localhost:3000/dashboard`
 *   2. This endpoint (on localhost:3000) reads the session cookie and redirects to the subdomain:
 *      → demo.localhost:3000/api/auth/session-relay?token=<JWE>&callbackUrl=/dashboard
 *   3. The subdomain instance receives the token, validates it, sets the cookie, and redirects to /dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const callbackUrl = searchParams.get("callbackUrl");
  const token = searchParams.get("token");

  if (!callbackUrl) {
    return NextResponse.json(
      { error: "Missing callbackUrl" },
      { status: 400 }
    );
  }

  // ── Step 2: We're on the subdomain — set the cookie and redirect ──
  if (token) {
    try {
      await decode({
        token,
        secret: process.env.AUTH_SECRET!,
        salt: COOKIE_SALT,
      });
    } catch {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    // Use the real Host header — Next.js dev normalizes request.url to localhost
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${getProtocol()}://${host}`;
    const destination = new URL(callbackUrl, baseUrl);
    const response = NextResponse.redirect(destination);

    const cookieDomain = getCookieDomain();
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return response;
  }

  // ── Step 1: We're on the main domain — read cookie, redirect to subdomain ──
  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // El callbackUrl en step 1 DEBE ser absoluto (vamos a redirigir al subdomain).
  // Si no parsea o el host no pertenece a nuestro dominio base, rechazar.
  let target: URL;
  try {
    target = new URL(callbackUrl);
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isSameAppDomain(target.host, request.headers.get("host"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const relayUrl = new URL("/api/auth/session-relay", target.origin);
  relayUrl.searchParams.set("token", sessionToken);
  relayUrl.searchParams.set("callbackUrl", target.pathname + target.search);

  return NextResponse.redirect(relayUrl.toString());
}

/**
 * Comprueba que `targetHost` (de la URL callback) sea el mismo dominio base
 * que el host actual. Acepta subdomains: ej. `demo.example.com` para host `example.com`.
 * Evita relay hacia hosts arbitrarios (`evil.com`).
 */
function isSameAppDomain(targetHost: string, currentHost: string | null): boolean {
  if (!currentHost) return false;
  const t = targetHost.replace(/:\d+$/, "").toLowerCase();
  const c = currentHost.replace(/:\d+$/, "").toLowerCase();
  if (t === c) return true;
  // Permitir subdomain del host actual: `demo.example.com` ↔ `example.com`
  if (t.endsWith(`.${c}`)) return true;
  if (c.endsWith(`.${t}`)) return true;
  // Mismo root domain (a.example.com ↔ b.example.com)
  const tRoot = t.split(".").slice(-2).join(".");
  const cRoot = c.split(".").slice(-2).join(".");
  return tRoot === cRoot && tRoot.includes(".");
}
