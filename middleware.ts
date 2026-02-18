import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  buildTenantUrl,
  extractTenantSlugFromHost,
  supportsSubdomains,
} from "@/lib/domain";

// Routes that require a tenant context (subdomain)
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
    pathname.startsWith("/api/public-stats")
  ) {
    return NextResponse.next();
  }

  // ─── Public: landing page ───
  if (pathname === "/") return NextResponse.next();

  // ─── Public page routes (login, register) ───
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName: "next-auth.session-token",
    salt: "next-auth.session-token",
  });
  const isLoggedIn = !!token;

  // ─── Detect hostname & subdomain support early ───
  const hostname = request.headers.get("host") || "";
  const hostOnly = hostname.replace(/:\d+$/, "");
  const canSubdomain = supportsSubdomains(hostOnly);
  const tenantSlug = extractTenantSlugFromHost(hostname);

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
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    // Super admin goes to admin panel
    if (token?.globalRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.nextUrl));
    }
    // User with tenant
    if (token?.tenantSlug) {
      if (canSubdomain) {
        // Redirect via session-relay to tenant subdomain
        const dashboardUrl = buildTenantUrl(token.tenantSlug, "/dashboard");
        const relayUrl = new URL("/api/auth/session-relay", request.nextUrl);
        relayUrl.searchParams.set("callbackUrl", dashboardUrl);
        return NextResponse.redirect(relayUrl);
      }
      // No subdomains → redirect directly to dashboard (tenant from JWT)
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
    // User without tenantSlug — let them access login to re-authenticate
    return NextResponse.next();
  }

  // ─── Tenant routes WITHOUT subdomain → resolve tenant context ───
  if (
    !tenantSlug &&
    isLoggedIn &&
    (isTenantRoute(pathname) || isTenantApiRoute(pathname))
  ) {
    // Super admin: use selected-tenant cookie to inject tenant context
    if (token?.globalRole === "SUPER_ADMIN") {
      const selectedTenant = request.cookies.get("selected-tenant")?.value;

      if (selectedTenant) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-tenant-slug", selectedTenant);
        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      }

      // No cookie + API route → error
      if (isTenantApiRoute(pathname)) {
        return NextResponse.json(
          { error: "Selecciona un lavadero primero." },
          { status: 400 }
        );
      }

      // No cookie + page route → let through (modal will show)
      return NextResponse.next();
    }

    // Regular user with tenantSlug in JWT
    if (token?.tenantSlug) {
      if (canSubdomain) {
        // Redirect to tenant subdomain via session-relay
        const tenantUrl = buildTenantUrl(
          token.tenantSlug,
          pathname + request.nextUrl.search
        );
        const relayUrl = new URL("/api/auth/session-relay", request.nextUrl);
        relayUrl.searchParams.set("callbackUrl", tenantUrl);
        return NextResponse.redirect(relayUrl);
      }

      // No subdomains → inject tenant header from JWT directly
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-tenant-slug", token.tenantSlug);
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // User has no tenant
    if (isTenantApiRoute(pathname)) {
      return NextResponse.json(
        {
          error:
            "Tenant no especificado. Accede desde el subdominio de tu lavadero.",
        },
        { status: 400 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // ─── Inject tenant slug header when we have a subdomain ───
  if (tenantSlug) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-slug", tenantSlug);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
