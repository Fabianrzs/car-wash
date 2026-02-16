export const SUPER_ADMIN = {
  email: "superadmin@carwash.com",
  password: "superadmin123",
};

export const TENANT_USER = {
  email: "carlos@demo-carwash.com",
  password: "password123",
  slug: "demo",
};

export const APP_DOMAIN = "localhost:3000";

export const TENANT_BASE_URL = `http://${TENANT_USER.slug}.${APP_DOMAIN}`;
