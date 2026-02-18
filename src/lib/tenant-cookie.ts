/**
 * Client-side helpers for the `selected-tenant` cookie.
 * Used by SUPER_ADMIN to persist tenant selection when subdomains aren't available.
 */

const COOKIE_NAME = "selected-tenant";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Read the selected tenant slug from the cookie. Returns `null` if not set. */
export function getSelectedTenant(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Set the selected tenant cookie. */
export function setSelectedTenant(slug: string): void {
  document.cookie = `${COOKIE_NAME}=${slug}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

/** Clear the selected tenant cookie. */
export function clearSelectedTenant(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
