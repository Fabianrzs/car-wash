/**
 * Domain utilities for multi-tenant support
 */

/**
 * Get the protocol based on environment
 */
export function getProtocol(): string {
  if (process.env.NODE_ENV === "production") {
    return "https";
  }
  return process.env.NEXTAUTH_URL?.startsWith("https") ? "https" : "http";
}

/**
 * Get the cookie domain for the current environment
 * Returns the appropriate domain for setting cookies across subdomains
 */
export function getCookieDomain(): string {
  const url = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  // For localhost, return empty string (cookies work without domain)
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "";
  }

  // For production domains, return the domain with leading dot for subdomain sharing
  return hostname;
}

/**
 * Build a tenant-specific URL
 */
export function buildTenantUrl(tenantSlug: string, path = ""): string {
  const protocol = getProtocol();
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const urlObj = new URL(baseUrl);

  // For localhost, add tenant as subdomain (localhost:3000 -> tenant.localhost:3000)
  if (urlObj.hostname === "localhost") {
    urlObj.hostname = `${tenantSlug}.localhost`;
  } else {
    // For production, add tenant as subdomain
    const parts = urlObj.hostname.split(".");
    urlObj.hostname = `${tenantSlug}.${urlObj.hostname}`;
  }

  if (path) {
    urlObj.pathname = path;
  }

  return urlObj.toString();
}

