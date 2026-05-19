/**
 * Client-side helpers for the `selected-tenant` cookie.
 * Used by SUPER_ADMIN to persist tenant selection when subdomains aren't available.
 */

import { getCookieDomain } from "@/lib/utils/domain";

const COOKIE_NAME = "selected-tenant";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function buildCookieAttrs(extra: string): string {
    const parts = [`path=/`, `SameSite=Lax`, extra];
    const domain = getCookieDomain();
    if (domain) parts.push(`Domain=${domain}`);
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
        parts.push("Secure");
    }
    return parts.join("; ");
}

/** Read the selected tenant slug from the cookie. Returns `null` if not set. */
export function getSelectedTenant(): string | null {
    const match = document.cookie.match(
        new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : null;
}

/** Set the selected tenant cookie. */
export function setSelectedTenant(slug: string): void {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(slug)}; ${buildCookieAttrs(`Max-Age=${MAX_AGE}`)}`;
}

/**
 * Clear the selected tenant cookie. Para que el borrado funcione, los atributos
 * `Domain` y `Path` deben coincidir con los del set; de lo contrario el browser
 * conserva la cookie. Por seguridad limpiamos también la versión sin Domain.
 */
export function clearSelectedTenant(): void {
    const expired = "Expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = `${COOKIE_NAME}=; ${buildCookieAttrs(expired)}`;
    // Fallback: borra también la variante sin Domain (cookies legacy de versiones anteriores).
    document.cookie = `${COOKIE_NAME}=; path=/; ${expired}`;
}
