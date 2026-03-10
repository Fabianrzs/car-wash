import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require a tenant context
const TENANT_ROUTES = [
  "/dashboard",
  "/clients",
  "/vehicles",
  "/services",
  "/orders",
  "/reports",
  "/settings",
  "/team",
  "/billing",
];

// API routes that require tenant context
const TENANT_API_ROUTES = [
  "/api/clients",
  "/api/vehicles",
  "/api/services",
  "/api/orders",
  "/api/reports",
  "/api/tenant",
];

function isTenantRoute(pathname: string): boolean {
  return TENANT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function isTenantApiRoute(pathname: string): boolean {
  return TENANT_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Public: auth API routes ───
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // ─── Public: webhook routes ───
  if (pathname.startsWith("/api/webhooks")) return NextResponse.next();

  // ─── Public: API routes without auth ───
  if (
    pathname.startsWith("/api/plans") ||
    pathname.startsWith("/api/public-stats") ||
    pathname.startsWith("/api/invite")
  ) {
    return NextResponse.next();
  }

  // ─── Public: landing page ───
  if (pathname === "/") return NextResponse.next();

  // ─── Public page routes (login, register) ───
  const publicRoutes = ["/login", "/register", "/invite"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName,
    salt: cookieName,
  });
  const isLoggedIn = !!token;

  // ─── Super admin routes: require SUPER_ADMIN role ───
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (token?.globalRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.nextUrl));
    }
    return NextResponse.next();
  }

  // ─── Not logged in + not public → redirect to login ───
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── Logged in + on login/register → redirect away ───
  if (isLoggedIn && isPublicRoute) {
    if (token?.globalRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.nextUrl));
    }
    if (token?.tenantSlug) {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
    return NextResponse.next();
  }

  // ─── Tenant routes → inject tenant context from session or cookie ───
  if (isLoggedIn && (isTenantRoute(pathname) || isTenantApiRoute(pathname))) {
    let tenantSlug: string | null = null;

    if (token?.globalRole === "SUPER_ADMIN") {
      // SUPER_ADMIN: tenant comes from selected-tenant cookie
      tenantSlug = request.cookies.get("selected-tenant")?.value ?? null;

      if (!tenantSlug) {
        if (isTenantApiRoute(pathname)) {
          return NextResponse.json(
            { error: "Selecciona un lavadero primero." },
            { status: 400 }
          );
        }
        // No cookie → let through (TenantSelectorModal will appear)
        return NextResponse.next();
      }
    } else {
      // Regular user: cookie takes precedence (multi-tenant switching),
      // fallback to JWT tenantSlug (single-tenant users set on login).
      const cookieTenant = request.cookies.get("selected-tenant")?.value;
      tenantSlug = cookieTenant || (token?.tenantSlug as string) || null;

      if (!tenantSlug) {
        if (isTenantApiRoute(pathname)) {
          return NextResponse.json(
            { error: "Tenant no especificado." },
            { status: 400 }
          );
        }
        // Let the TenantGuard handle selection client-side
        return NextResponse.next();
      }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-slug", tenantSlug);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
