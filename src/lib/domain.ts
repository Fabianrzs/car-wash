/**
 * Centralized domain, protocol, and cookie utilities.
 *
 * Every file that needs APP_DOMAIN, protocol detection, cookie domain,
 * or tenant URL construction should import from here.
 *
 * - Client (browser): uses `window.location` for protocol & host — always
 *   reflects the real origin the user is accessing.
 * - Server: falls back to `NEXT_PUBLIC_APP_DOMAIN` env var.
 */

const ENV_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";

const isClient = typeof window !== "undefined";

/** True when the host is a raw IPv4 address (e.g. 192.168.1.8). */
function isIPAddress(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

/**
 * The full domain with port (e.g. "localhost:3000", "192.168.1.8:3000", "carwash.com").
 * On the client reads from `window.location.host`.
 */
export function getAppDomain(): string {
  if (isClient) return window.location.host;
  return ENV_DOMAIN;
}

/**
 * Host portion without the port (e.g. "192.168.1.8" or "localhost").
 * On the client reads from `window.location.hostname`.
 */
export function getAppHost(): string {
  if (isClient) return window.location.hostname;
  return ENV_DOMAIN.replace(/:\d+$/, "");
}

/**
 * Returns "http" or "https".
 * On the client reads directly from `window.location.protocol`.
 * On the server infers from the domain (localhost/IP → http, otherwise https).
 */
export function getProtocol(): string {
  if (isClient) return window.location.protocol.replace(":", "");
  const host = getAppHost();
  if (host === "localhost" || isIPAddress(host)) return "http";
  return "https";
}

/**
 * Cookie domain for sharing cookies across subdomains.
 *
 * - IP addresses  → `undefined` (browser defaults to exact origin;
 *   IPs don't support subdomain cookies).
 * - localhost      → `.localhost`
 * - example.com    → `.example.com`
 * - sub.example.com → `.example.com`
 */
export function getCookieDomain(): string | undefined {
  const host = getAppHost();
  if (isIPAddress(host)) return undefined;
  if (host === "localhost") return ".localhost";
  const parts = host.split(".");
  if (parts.length <= 2) return `.${host}`;
  return `.${parts.slice(-2).join(".")}`;
}

/**
 * Build a full URL for a tenant subdomain.
 *
 * For IP addresses (where subdomains don't work) it falls back to the
 * base domain so the middleware can route via the x-tenant-slug header.
 *
 * @example buildTenantUrl("demo", "/dashboard") → "http://demo.localhost:3000/dashboard"
 */
export function buildTenantUrl(slug: string, path = "/"): string {
  const protocol = getProtocol();
  const domain = getAppDomain();
  const host = getAppHost();
  if (isIPAddress(host)) {
    return `${protocol}://${domain}${path}`;
  }
  return `${protocol}://${slug}.${domain}${path}`;
}

/**
 * Extract tenant slug from a Host header value.
 *
 * e.g. "demo.localhost:3000" → "demo"
 *      "demo.carwash.com"    → "demo"
 *      "localhost:3000"      → null
 *      "192.168.1.8:3000"    → null  (IPs have no subdomains)
 */
export function extractTenantSlugFromHost(host: string): string | null {
  const hostOnly = host.replace(/:\d+$/, "");
  if (isIPAddress(hostOnly)) return null;

  const appDomain = ENV_DOMAIN;
  const appHost = ENV_DOMAIN.replace(/:\d+$/, "");
  if (host === appDomain || host === appHost) return null;

  const localhostMatch = host.match(/^([^.]+)\.localhost/);
  if (localhostMatch) return localhostMatch[1];

  const subdomain = host.replace(`.${appHost}`, "").replace(/:\d+$/, "");
  if (subdomain && subdomain !== host && subdomain !== appHost) {
    return subdomain;
  }

  return null;
}
