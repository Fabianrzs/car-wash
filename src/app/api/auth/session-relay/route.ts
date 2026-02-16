import { NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";

const COOKIE_NAME = "next-auth.session-token";

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
        salt: COOKIE_NAME,
      });
    } catch {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    // Use the real Host header — Next.js dev normalizes request.url to localhost
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `http://${host}`;
    const destination = new URL(callbackUrl, baseUrl);
    const response = NextResponse.redirect(destination);

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  }

  // ── Step 1: We're on the main domain — read cookie, redirect to subdomain ──
  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const target = new URL(callbackUrl);
  const relayUrl = new URL("/api/auth/session-relay", target.origin);
  relayUrl.searchParams.set("token", sessionToken);
  relayUrl.searchParams.set("callbackUrl", target.pathname + target.search);

  return NextResponse.redirect(relayUrl.toString());
}
