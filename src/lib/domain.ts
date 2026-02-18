/**
 * Centralized domain, protocol, and cookie utilities.
 *
 * Every file that needs APP_DOMAIN, protocol detection, cookie domain,
 * or tenant URL construction should import from here.
 *
 * - Client (browser): uses `window.location` for protocol & host — always
 *   reflects the real origin the user is accessing.
 * - Server: falls back to `NEXT_PUBLIC_APP_DOMAIN` env var.
 *
 * IMPORTANT — Set `NEXT_PUBLIC_APP_DOMAIN` correctly per environment:
 *   - Local:      localhost:3000
 *   - Production: car-wash-drab.vercel.app  (or your custom domain)
 */

const ENV_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";

const isClient = typeof window !== "undefined";

/** True when the host is a raw IPv4 address (e.g. 192.168.1.8). */
function isIPAddress(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

/** Known shared-hosting platforms where wildcard subdomains are unavailable. */
const SHARED_PLATFORMS = [
  "vercel.app",
  "netlify.app",
  "herokuapp.com",
  "railway.app",
  "fly.dev",
  "render.com",
];

/**
 * Whether the given hostname supports tenant subdomains.
 *
 * Returns `false` for:
 *   - Raw IP addresses (192.168.1.8)
 *   - Shared hosting platforms (*.vercel.app, *.netlify.app, …)
 *
 * Returns `true` for:
 *   - localhost  (tenant.localhost works in most browsers)
 *   - Custom domains (tenant.carwash.com)
 */
export function supportsSubdomains(host?: string): boolean {
  const h = host || getAppHost();
  if (isIPAddress(h)) return false;
  return !SHARED_PLATFORMS.some((platform) => h.endsWith(platform));
}

/**
 * The full domain with port (e.g. "localhost:3000", "carwash.com").
 * On the client reads from `window.location.host`.
 */
export function getAppDomain(): string {
  if (isClient) return window.location.host;
  return ENV_DOMAIN;
}

/**
 * Host portion without the port (e.g. "localhost" or "carwash.com").
 * On the client reads from `window.location.hostname`.
 */
export function getAppHost(): string {
  if (isClient) return window.location.hostname;
  return ENV_DOMAIN.replace(/:\d+$/, "");
}

/**
 * Returns "http" or "https".
 * - Client: reads from `window.location.protocol`.
 * - Server production (`NODE_ENV=production`): always "https".
 * - Server dev: "http" for localhost/IP, "https" otherwise.
 */
export function getProtocol(): string {
  if (isClient) return window.location.protocol.replace(":", "");
  if (process.env.NODE_ENV === "production") return "https";
  const host = getAppHost();
  if (host === "localhost" || isIPAddress(host)) return "http";
  return "https";
}

/**
 * Cookie domain for sharing cookies across subdomains.
 *
 * - IP addresses         → `undefined` (browser defaults to exact origin)
 * - localhost             → `.localhost`
 * - Shared platforms      → `.{full-host}` (e.g. `.car-wash-drab.vercel.app`)
 * - Custom 2-part domain  → `.example.com`
 * - Custom 3+-part domain → `.example.com` (root)
 */
export function getCookieDomain(): string | undefined {
  const host = getAppHost();
  if (isIPAddress(host)) return undefined;
  if (host === "localhost") return ".localhost";

  // Shared platforms: scope to the full app hostname (NOT the platform root)
  if (!supportsSubdomains(host)) return `.${host}`;

  // Custom domain: scope to root for subdomain sharing
  const parts = host.split(".");
  if (parts.length <= 2) return `.${host}`;
  return `.${parts.slice(-2).join(".")}`;
}

/**
 * Build a full URL for a tenant subdomain.
 *
 * When subdomains are NOT supported (IP, shared platform):
 *   → returns the same-origin URL (caller should use cookie-based tenant context).
 *
 * When subdomains ARE supported:
 *   → returns `protocol://slug.domain/path`
 */
export function buildTenantUrl(slug: string, path = "/"): string {
  const protocol = getProtocol();
  const domain = getAppDomain();
  const host = getAppHost();

  if (!supportsSubdomains(host)) {
    // Same origin — tenant context via cookie / JWT header
    return `${protocol}://${domain}${path}`;
  }

  return `${protocol}://${slug}.${domain}${path}`;
}

/**
 * Build a URL on the base domain (without subdomain).
 * On client uses `window.location`, on server uses ENV_DOMAIN.
 */
export function getBaseDomainUrl(path = "/"): string {
  const protocol = getProtocol();
  const domain = isClient ? ENV_DOMAIN : ENV_DOMAIN;
  return `${protocol}://${domain}${path}`;
}

/**
 * Extract tenant slug from a Host header value.
 *
 * e.g. "demo.localhost:3000" → "demo"
 *      "demo.carwash.com"    → "demo"
 *      "localhost:3000"      → null
 *      "192.168.1.8:3000"    → null  (IPs have no subdomains)
 *      "car-wash-drab.vercel.app" → null (shared platform, no subdomains)
 */
export function extractTenantSlugFromHost(host: string): string | null {
  const hostOnly = host.replace(/:\d+$/, "");
  if (isIPAddress(hostOnly)) return null;

  // Shared platforms don't support subdomains
  if (!supportsSubdomains(hostOnly)) return null;

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
