# Car Wash SaaS — CLAUDE.md

## Stack

- **Next.js 16.1.6** (App Router + Turbopack), React 19, TypeScript 5
- **Prisma 7** + PostgreSQL (`@prisma/adapter-pg`)
- **NextAuth v5** (beta.30) — Credentials provider
- **Tailwind CSS v4**
- **Stripe** + **PayU** para pagos
- **driver.js** para onboarding tours

## Architecture

Multi-tenant SaaS: cada lavadero es un `Tenant` con `slug`.

**Roles:** `SUPER_ADMIN` (global), `OWNER`, `ADMIN`, `EMPLOYEE` (por tenant)

**Tenant context:** inyectado via header `x-tenant-slug` en `middleware.ts`.
`selected-tenant` cookie para SUPER_ADMIN navegando entre tenants.

## Module Structure

`src/modules/<module>/` — cada módulo tiene:
- `index.ts` — public API exports (siempre importar desde aquí)
- `repositories/` — acceso a DB via Prisma
- `services/` — lógica de negocio
- `handlers/` — manejadores HTTP
- `validations/` — schemas Zod

Módulos: `auth`, `clients`, `cron`, `invite`, `onboarding`, `orders`, `plans`, `public-stats`, `reports`, `services`, `stats`, `tenant`, `tenants`, `user`, `users`, `vehicles`, `webhooks`

## Key Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Auth + tenant injection |
| `src/lib/auth.config.ts` | NextAuth Credentials config |
| `src/lib/tenant.ts` | `requireTenant`, `requireActivePlan`, `TenantError` |
| `src/lib/api.ts` | `fetchApi` helper (maneja 401) |
| `src/lib/validations.ts` | Zod schemas compartidos |
| `src/lib/constants.ts` | `STATUS_LABELS`, `ITEMS_PER_PAGE=10` |
| `src/lib/rate-limit.ts` | Rate limiting in-memory (reemplazar por Upstash en prod) |
| `src/components/guards/PlanBlockingGuard.tsx` | Bloqueo por plan |
| `src/components/guards/TenantSelectorModal.tsx` | Modal selector tenant |
| `src/app/(dashboard)/layout.tsx` | Layout dashboard |

## Prisma Schema (multi-file)

Schema dividido en `prisma/schema/`:
- `config.prisma` — generator + datasource
- `enums.prisma` — todos los enums
- `auth.prisma` — User, Account, Session, VerificationToken
- `tenant.prisma` — Plan, Tenant, TenantUser, Invitation
- `business.prisma` — Client, Vehicle, ClientVehicle, ServiceType, ServiceOrder, OrderItem
- `billing.prisma` — Invoice, InvoiceItem, Payment, ScheduledPlanChange, PaymentReminder
- `onboarding.prisma` — OnboardingFlow, OnboardingStep, OnboardingFlowPlan, OnboardingFlowTenant, UserOnboardingCompletion

`prisma.config.ts` apunta a `schema: "prisma/schema"`.

> **DB:** Usar `prisma db push` (no `prisma migrate dev`) — Supabase tiene drift de historial de migraciones.

## Client↔Vehicle Relation (Many-to-Many)

- `Vehicle` NO tiene `clientId` — relación via tabla `ClientVehicle`
- `ClientVehicle`: `clientId`, `vehicleId`, `tenantId`, `@@unique([clientId, vehicleId])`
- `vehicleSchema` usa `clientIds: z.array(z.string()).min(1)`
- API `POST /api/vehicles`: body `{ ...campos, clientIds: string[] }`
- API `POST /api/clients`: body acepta `vehicle?: {...}` opcional
- Órdenes: validar que exista `ClientVehicle(clientId, vehicleId, tenantId)` antes de crear

## Onboarding System (driver.js)

- Hook: `src/hooks/useOnboardingFlow.ts`
- Component: `src/components/onboarding/OnboardingTour.tsx`
- Uso: `<OnboardingTour flowKey="orders" />` + `data-onboarding="orders-new-btn"` en elementos target
- API pública: `GET /api/onboarding/[key]`, `POST /api/onboarding/[key]/complete`
- API admin: `/api/admin/onboarding/**`
- Seed: `npx dotenv-cli -e .env -- npx tsx prisma/seed-onboarding.ts`
- Acceso: SUPER_ADMIN siempre ve; tenant override gana sobre plan; sin filas en planAccess = todos los planes

## Common Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # prisma generate + next build
npm run lint         # ESLint

npx prisma db push              # Sync schema to DB (no migration history)
npx prisma generate             # Regenerate Prisma client
npx tsx prisma/seed.ts          # Seed base data
npx dotenv-cli -e .env -- npx tsx prisma/seed-onboarding.ts  # Seed onboarding

npx playwright test             # E2E tests
```

## Routes

**Dashboard (tenant):** `/dashboard`, `/clients`, `/vehicles`, `/orders`, `/services`, `/reports`, `/settings`, `/team`, `/billing`

**Admin (SUPER_ADMIN):** `/admin`, `/admin/tenants`, `/admin/plans`, `/admin/users`, `/admin/onboarding`

**Auth:** `/login`, `/register`, `/invite`

## Development Notes

- **Workflow:** trunk-based (commits directo a `main`), validar TypeScript antes de commit
- **Imports:** usar paths absolutos `@/modules/...`, `@/lib/...`, `@/components/...`
- **Siempre importar desde `index.ts` del módulo**, nunca directamente desde archivos internos
- **E2E tests:** `e2e/helpers/constants.ts` para constantes compartidas
