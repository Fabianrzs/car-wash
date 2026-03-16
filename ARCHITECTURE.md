# ARCHITECTURE.md — Car Wash SaaS

> Documento de arquitectura oficial del proyecto. Todos los módulos deben seguir estos patrones exactamente.

---

## 1. Stack Tecnológico

| Componente | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router + Turbopack) | 16.1.6 |
| Lenguaje | TypeScript | 5.x |
| Runtime UI | React | 19.x |
| ORM | Prisma | 7.x |
| Base de Datos | PostgreSQL (via Supabase) | — |
| Adaptador DB | `@prisma/adapter-pg` | — |
| Autenticación | NextAuth v5 beta | 5.0.0-beta.30 |
| Pagos | Stripe + PayU | — |
| Estilos | Tailwind CSS | 4.x |
| Tours UI | driver.js | 1.4.x |
| Validación | Zod | 4.x |

---

## 2. Arquitectura General

El sistema es un **SaaS multi-tenant** donde cada negocio (lavadero) es un `Tenant` con un `slug` único. El contexto de tenant se inyecta en cada request via middleware HTTP.

```
Browser / Client
     │
     ▼
Next.js Middleware (middleware.ts)
     │  - Autenticación via JWT
     │  - Inyecta header x-tenant-slug
     ▼
Next.js API Route (src/app/api/...)
     │  - Solo re-exporta handlers del módulo
     ▼
Handler (src/modules/*/handlers/*.handler.ts)
     │  - Valida sesión (requireAuth)
     │  - Resuelve tenant (requireTenantContext)
     │  - Valida plan activo (ensureActivePlan)
     │  - Parsea y valida body (Zod)
     │  - Llama al service
     ▼
Service (src/modules/*/services/*.service.ts)
     │  - Lógica de negocio pura
     │  - Orquesta repositorios
     │  - Ejecuta transacciones
     ▼
Repository (src/modules/*/repositories/*.repository.ts)
     │  - Única capa con acceso a Prisma
     │  - Extiende BaseRepository
     │  - Métodos de consulta tipados
     ▼
Prisma Client (src/database/prisma.ts)
     ▼
PostgreSQL
```

---

## 3. Estructura de Directorios

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas auth: /login, /register
│   ├── (dashboard)/              # Rutas tenant: /dashboard, /clients, ...
│   ├── (admin)/                  # Rutas SUPER_ADMIN: /admin, ...
│   └── api/                      # API Routes (solo re-exportan handlers)
│
├── modules/                      # Módulos de dominio (ver sección 4)
│   ├── auth/
│   ├── clients/                  # REFERENCIA ✅
│   ├── cron/
│   ├── invite/
│   ├── onboarding/
│   ├── orders/                   # REFERENCIA ✅
│   ├── plans/                    # REFERENCIA ✅
│   ├── public-stats/
│   ├── reports/
│   ├── services/
│   ├── stats/
│   ├── tenant/
│   ├── tenants/
│   ├── user/
│   ├── users/
│   ├── vehicles/                 # REFERENCIA ✅
│   └── webhooks/
│
├── repositories/
│   ├── base.repository.ts        # BaseRepository genérico
│   └── transaction.repository.ts # runTransaction helper
│
├── database/
│   ├── prisma.ts                 # PrismaClient singleton
│   └── transaction-manager.ts   # prisma.$transaction wrapper
│
├── middleware/                   # Middleware de request HTTP
│   ├── auth.middleware.ts        # requireAuth()
│   ├── tenant.middleware.ts      # requireTenantContext(), requireTenantAccess(), ensureManagementAccess()
│   ├── plan.middleware.ts        # ensureActivePlan()
│   └── admin.middleware.ts       # requireSuperAdmin()
│
└── lib/                          # Utilidades y servicios compartidos
    ├── auth/                     # Configuración NextAuth
    ├── database/                 # query-builder.ts, tipos DB
    ├── email/                    # Servicio de correos
    ├── http/                     # ApiResponse, HttpError, module-error-factory
    ├── multitenancy/             # requireTenant, TenantError, TenantPlanStatus
    ├── payments/                 # stripe.ts, payu.ts, invoice.ts
    ├── security/                 # rate-limit.ts
    ├── utils/                    # cn, formatCurrency, constants, normalization, domain, order-number
    └── validations/              # Shared Zod schemas (shared.schema.ts)
```

---

## 4. Estructura Estándar de Módulos

**Todos los módulos deben seguir esta estructura exacta** (basada en los módulos de referencia: `clients`, `orders`, `plans`, `vehicles`):

```
src/modules/{module-name}/
├── index.ts                              # Barrel: exports públicos del módulo
├── {module}.errors.ts                    # Error class + handler HTTP
├── {module}.utils.ts                     # (Opcional) Normalización y builders
├── filters/
│   └── {module}.filter.ts               # (Opcional) Filter builders para queries complejas
├── validations/
│   └── {module}.validation.ts           # Zod schemas + tipos inferidos
├── repositories/
│   └── {module}.repository.ts           # Clase extendiendo BaseRepository
├── services/
│   ├── create-{entity}.service.ts
│   ├── list-{entities}.service.ts
│   ├── get-{entity}-detail.service.ts
│   ├── update-{entity}.service.ts
│   └── delete-{entity}.service.ts
├── handlers/
│   ├── create-{entity}.handler.ts
│   ├── get-{entities}.handler.ts
│   ├── get-{entity}-by-id.handler.ts
│   ├── update-{entity}.handler.ts
│   └── delete-{entity}.handler.ts
└── api/
    ├── {entities}.api.ts                # GET /api/{entities}, POST /api/{entities}
    └── {entity}-detail.api.ts           # GET, PUT, DELETE /api/{entities}/[id]
```

### Naming Conventions

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | kebab-case | `create-client.service.ts` |
| Carpetas módulo | kebab-case | `src/modules/clients/` |
| Clases | PascalCase | `ClientRepository`, `ClientModuleError` |
| Funciones | camelCase | `createClientService()`, `buildClientFilter()` |
| Tipos/Interfaces | PascalCase | `CreateClientInput`, `ClientListItem` |
| Constantes | UPPER_SNAKE_CASE | `ITEMS_PER_PAGE`, `RESERVED_SLUGS` |
| Mensajes de error | Español, primera letra mayúscula | `"Ya existe un cliente con ese email"` |

---

## 5. Responsabilidades por Capa

### 5.1 API Route (`api/*.api.ts`)

**Solo exporta handlers.** Sin lógica propia.

```typescript
// src/modules/clients/api/clients.api.ts
export { getClientsHandler as GET } from "@/modules/clients/handlers/get-clients.handler";
export { createClientHandler as POST } from "@/modules/clients/handlers/create-client.handler";
```

> ❌ NUNCA agregar lógica en la API route.

---

### 5.2 Handler (`handlers/*.handler.ts`)

**Responsabilidades:**
1. Validar sesión → `requireAuth()`
2. Resolver tenant → `requireTenantContext(request.headers)`
3. Verificar membresía → `requireTenantAccess()` o `ensureManagementAccess()`
4. Verificar plan activo → `ensureActivePlan()` (cuando aplique)
5. Parsear y validar body/query → Zod `.parse()`
6. Llamar al service
7. Devolver respuesta → `ApiResponse.ok()` / `ApiResponse.created()`
8. Capturar errores → `handleXxxHttpError(error, "contexto")`

```typescript
// Patrón estándar de handler
export async function createClientHandler(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId, tenant } = await requireTenantContext(request.headers);
    await ensureActivePlan(tenantId, session.user.globalRole, tenant);

    const body = await request.json();
    const data = clientSchema.parse(body);

    const client = await createClientService({ tenantId, data });
    return ApiResponse.created(client);
  } catch (error) {
    return handleClientHttpError(error, "Error al crear cliente:");
  }
}
```

> ❌ NUNCA acceder a Prisma directamente en un handler.
> ❌ NUNCA contener lógica de negocio en un handler.
> ❌ NUNCA usar `NextResponse.json()` directamente — usar `ApiResponse`.

---

### 5.3 Service (`services/*.service.ts`)

**Responsabilidades:**
1. Lógica de negocio pura
2. Orquestar repositorios
3. Ejecutar transacciones cuando se necesite atomicidad
4. Aplicar reglas de dominio (validaciones de unicidad, existencia, estado)
5. Lanzar errores de dominio (`XxxModuleError`, `HttpError`)

```typescript
// Patrón estándar de service
export async function createClientService({
  tenantId,
  data,
}: {
  tenantId: string;
  data: CreateClientInput;
}) {
  const payload = buildClientWritePayload(data);

  if (payload.email) {
    const existing = await clientRepository.findFirst({
      where: { email: payload.email, tenantId },
    });
    if (existing) {
      throw new ClientModuleError("Ya existe un cliente con ese email", 409);
    }
  }

  return runTransaction(async (tx) => {
    const client = await clientRepository.create({ data: { ...payload, tenantId } }, tx);
    if (data.vehicle) {
      // ... crear vehículo y junction
    }
    return client;
  });
}
```

> ❌ NUNCA devolver `NextResponse` o `Response` desde un service.
> ❌ NUNCA acceder a Prisma directamente — solo via repositorios.
> ❌ NUNCA depender de `request`, `headers` o cualquier objeto HTTP.

---

### 5.4 Repository (`repositories/*.repository.ts`)

**Responsabilidades:**
1. Única capa con acceso a Prisma
2. Extender `BaseRepository`
3. Definir perfiles de select/include como propiedades de clase
4. Métodos de consulta customizados que no cubre BaseRepository
5. Soporte de contexto de transacción via parámetro opcional `database`

```typescript
// Patrón estándar de repository
import { prisma } from "@/database/prisma";
import { BaseRepository } from "@/repositories/base.repository";
import type { Prisma } from "@/generated/prisma/client";

type ClientsDatabase = typeof prisma | Prisma.TransactionClient;

class ClientRepository extends BaseRepository<typeof prisma.client> {
  constructor() {
    super(prisma.client);
  }

  // Perfiles de select/include como propiedades
  readonly listSelect = {
    id: true, firstName: true, lastName: true,
    phone: true, email: true, isFrequent: true,
    _count: { select: { serviceOrders: true } },
  };

  readonly detailInclude = {
    vehicles: { ... },
    orders: { ... },
  };

  // Métodos que necesitan acceso al contexto de transacción
  findMany(args: Prisma.ClientFindManyArgs, database?: ClientsDatabase) {
    return (database ?? prisma).client.findMany(args);
  }

  findFirst(args: Prisma.ClientFindFirstArgs, database?: ClientsDatabase) {
    return (database ?? prisma).client.findFirst(args);
  }

  create(args: Prisma.ClientCreateArgs, database?: ClientsDatabase) {
    return (database ?? prisma).client.create(args);
  }

  update(args: Prisma.ClientUpdateArgs, database?: ClientsDatabase) {
    return (database ?? prisma).client.update(args);
  }

  // Métodos customizados para relaciones
  createClientVehicle(args: Prisma.ClientVehicleCreateArgs, database?: ClientsDatabase) {
    return (database ?? prisma).clientVehicle.create(args);
  }
}

export const clientRepository = new ClientRepository();
```

> ❌ NUNCA importar `prisma` fuera de repositorios.
> ✅ SIEMPRE usar `database ?? prisma` para soportar transacciones.
> ✅ SIEMPRE exportar una instancia singleton (`export const clientRepository = new ClientRepository()`).

---

### 5.5 Validation (`validations/*.validation.ts`)

Define los Zod schemas del módulo y exporta los tipos inferidos:

```typescript
export const clientSchema = z.object({
  firstName: z.string().trim().min(2, "Mínimo 2 caracteres"),
  lastName: z.string().trim().min(2, "Mínimo 2 caracteres"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(7),
  isFrequent: z.boolean().default(false),
  vehicle: clientVehicleSchema.optional(),
});

export type CreateClientInput = z.infer<typeof clientSchema>;
```

---

### 5.6 Errors (`*.errors.ts`)

Cada módulo tiene su propio error class y handler:

```typescript
// client.errors.ts
import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const ClientModuleError = createModuleErrorClass("Client");
export const handleClientHttpError = createModuleErrorHandler(
  "Cliente",
  "Datos de cliente inválidos"
);
```

`handleClientHttpError(error, contextMsg)` maneja automáticamente:
- `TenantError` → 400/401/403/404 según `.status`
- `ZodError` → 400 con detalles de validación
- `HttpError` → 400/401/403/404/500 según `.status`
- Otros → `console.error(contextMsg, error)` + 500

---

## 6. Flujo de Ejecución Completo

### Ejemplo: `POST /api/clients`

```
1. Request llega a Next.js
2. middleware.ts:
   - Verifica JWT (next-auth)
   - Inyecta header: x-tenant-slug = "demo-car-wash"
3. src/app/api/clients/route.ts:
   - export { createClientHandler as POST }
4. createClientHandler(request):
   - requireAuth() → session = { user: { id, globalRole, ... } }
   - requireTenantContext(headers) → { tenantId: "abc-123", tenant: {...} }
   - ensureActivePlan(tenantId, globalRole, tenant) → verifica plan no bloqueado
   - clientSchema.parse(body) → { firstName, lastName, phone, ... }
   - createClientService({ tenantId, data })
5. createClientService:
   - buildClientWritePayload(data) → normaliza strings
   - clientRepository.findFirst({ where: { email, tenantId } }) → verifica unicidad
   - runTransaction(async (tx) => {
       clientRepository.create({ data: { ...payload, tenantId } }, tx)
       if (data.vehicle) → clientRepository.createVehicle({...}, tx) + createClientVehicle({...}, tx)
     })
6. ApiResponse.created(client) → NextResponse con status 201
```

---

## 7. Multi-Tenancy

### Inyección de Contexto

El middleware (`middleware.ts`) inyecta `x-tenant-slug` en el header de cada request autenticado a rutas de tenant:

```typescript
requestHeaders.set("x-tenant-slug", tenantSlug);
return NextResponse.next({ request: { headers: requestHeaders } });
```

### Resolución de Tenant

`requireTenantContext()` lee el header `x-tenant-slug` y hace la query DB:

```typescript
// src/middleware/tenant.middleware.ts
export async function requireTenantContext(requestHeaders?: Headers) {
  return requireTenant(requestHeaders);  // lib/multitenancy/tenant.ts
}
```

```typescript
// src/lib/multitenancy/tenant.ts
export async function requireTenant(requestHeaders?: Headers) {
  const slug = requestHeaders?.get("x-tenant-slug") ?? (await headers()).get("x-tenant-slug");
  if (!slug) throw new TenantError("Tenant no especificado", 400);
  const tenant = await resolveTenant(slug);
  if (!tenant) throw new TenantError("Tenant no encontrado", 404);
  return { tenantId: tenant.id, tenant };
}
```

### Niveles de Acceso

| Función Middleware | Requiere | Lanza si falla |
|---|---|---|
| `requireTenantAccess(userId, tenantId, globalRole)` | Ser miembro del tenant | `TenantError(403)` |
| `ensureManagementAccess(userId, tenantId, globalRole)` | Rol ADMIN u OWNER | `ForbiddenError(403)` |
| Manual: `tenantUser.role === "OWNER"` | Rol OWNER | `ForbiddenError(403)` |

> **SUPER_ADMIN**: nunca bloqueado por tenant ni plan, pero puede navegar tenants via cookie `selected-tenant`.

### Tenant Scoping en Queries

**Regla crítica**: Toda query a la DB debe incluir `tenantId` en el `where`:

```typescript
// ✅ Correcto
await clientRepository.findFirst({ where: { id: clientId, tenantId } });

// ❌ Incorrecto — fuga de datos cross-tenant
await clientRepository.findFirst({ where: { id: clientId } });
```

---

## 8. Transacciones

### Cuándo usar transacciones

Usar `runTransaction()` siempre que se deban realizar múltiples operaciones DB de forma atómica:

```typescript
import { runTransaction } from "@/repositories/transaction.repository";

export async function createClientService({ tenantId, data }) {
  return runTransaction(async (tx) => {
    const client = await clientRepository.create({ data: {...} }, tx);
    const vehicle = await clientRepository.createVehicle({ data: {...} }, tx);
    await clientRepository.createClientVehicle({ data: {...} }, tx);
    return client;
  });
}
```

### Pasar transacción a repositorios

Los repositorios aceptan un parámetro opcional `database?: PrismaClient | Prisma.TransactionClient`:

```typescript
// En el repository
findFirst(args: Prisma.ClientFindFirstArgs, database?: ClientsDatabase) {
  return (database ?? prisma).client.findFirst(args);
}

// En el service
const client = await clientRepository.findFirst({ where: { id } }, tx);
```

---

## 9. BaseRepository

`src/repositories/base.repository.ts` provee CRUD genérico para cualquier modelo Prisma:

```typescript
class BaseRepository<TDelegate extends CrudDelegate> {
  constructor(protected readonly model: TDelegate) {}

  findMany(args)   // Equivale a prisma.model.findMany(args)
  findFirst(args)  // Equivale a prisma.model.findFirst(args)
  create(args)     // Equivale a prisma.model.create(args)
  update(args)     // Equivale a prisma.model.update(args)
  delete(args)     // Equivale a prisma.model.delete(args)
  count(args)      // Equivale a prisma.model.count(args)
}
```

**Extender** para soporte de transacciones y métodos customizados:

```typescript
class ClientRepository extends BaseRepository<typeof prisma.client> {
  constructor() { super(prisma.client); }

  // Override con soporte de transacción
  findMany(args: Prisma.ClientFindManyArgs, database?: ClientsDatabase) {
    return (database ?? prisma).client.findMany(args);
  }

  // Métodos customizados
  findLatestOrderNumber(tenantId: string, prefix: string) {
    return prisma.serviceOrder.findFirst({
      where: { tenantId, orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
  }
}
```

---

## 10. Manejo de Errores

### Jerarquía de errores

```
Error (JS nativo)
├── HttpError (lib/http/errors.ts) — status: number, details?: unknown
│   ├── UnauthorizedError — status 401
│   ├── ForbiddenError — status 403
│   └── XxxModuleError (via createModuleErrorClass) — status configurable
└── TenantError (lib/multitenancy/tenant.ts) — status: number
```

### Flujo de manejo en handlers

```typescript
try {
  // lógica del handler
} catch (error) {
  return handleClientHttpError(error, "Error al crear cliente:");
  // handleApiError internamente maneja:
  // - TenantError → 400/401/403/404 según status
  // - ZodError    → 400 con error.flatten()
  // - HttpError   → según status
  // - Otros       → console.error + 500
}
```

### Cuándo lanzar qué error

| Situación | Error a lanzar |
|---|---|
| Recurso no existe (no tenant data) | `new ClientModuleError("No encontrado", 404)` |
| Conflicto de unicidad | `new ClientModuleError("Ya existe...", 409)` |
| No autorizado para operación | `new ForbiddenError("No tienes permisos")` |
| Validación de negocio | `new ClientModuleError("Mensaje", 400)` |
| Tenant no miembro | Lanzado por `requireTenantAccess()` |

---

## 11. Paginación

Patrón estándar para endpoints paginados:

```typescript
// Validation
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  search: z.string().trim().optional(),
});

// Service
export async function listClientsService({ tenantId, page, take, search }) {
  const skip = (page - 1) * take;
  const where = buildClientFilter({ tenantId, search });

  const [clients, total] = await Promise.all([
    clientRepository.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    clientRepository.count({ where }),
  ]);

  return {
    clients,
    total,
    pages: Math.ceil(total / take),
  };
}
```

---

## 12. Filter Builders

Para queries con lógica de filtrado reutilizable, crear `filters/{module}.filter.ts`:

```typescript
// src/modules/clients/filters/client.filter.ts
export function buildClientFilter({
  tenantId,
  search,
  isFrequent,
}: ClientFilterParams): Prisma.ClientWhereInput {
  return {
    tenantId,
    ...(isFrequent !== undefined && { isFrequent }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };
}
```

---

## 13. Módulos y sus Rutas

### Dashboard (tenant context requerido)

| Módulo | Ruta | Descripción |
|---|---|---|
| `clients` | `/api/clients`, `/api/clients/[id]`, `/api/clients/[id]/history` | CRUD clientes |
| `vehicles` | `/api/vehicles`, `/api/vehicles/[id]`, `/api/vehicles/[id]/clients` | CRUD vehículos + asociaciones |
| `orders` | `/api/orders`, `/api/orders/[id]`, `/api/orders/[id]/status`, etc. | CRUD órdenes |
| `services` | `/api/services`, `/api/services/[id]` | CRUD tipos de servicio |
| `reports` | `/api/reports`, `/api/reports/orders` | Reportes y estadísticas |
| `tenant` | `/api/tenant/settings`, `/api/tenant/team`, `/api/tenant/billing`, etc. | Configuración del tenant |
| `user` | `/api/user/tenants` | Tenants del usuario actual |

### Admin (SUPER_ADMIN)

| Módulo | Ruta | Descripción |
|---|---|---|
| `tenants` | `/api/admin/tenants`, `/api/admin/tenants/[id]` | Gestión de tenants |
| `users` | `/api/admin/users` | Gestión de usuarios |
| `plans` | `/api/admin/plans`, `/api/admin/plans/[id]` | CRUD planes |
| `onboarding` | `/api/admin/onboarding/**` | CRUD flows de onboarding |
| `stats` | `/api/admin/stats` | Estadísticas globales |

### Públicas (sin auth)

| Módulo | Ruta | Descripción |
|---|---|---|
| `plans` | `/api/plans` | Lista pública de planes |
| `public-stats` | `/api/public-stats` | Estadísticas para landing |
| `invite` | `/api/invite/[token]` | Consultar invitación |
| `auth` | `/api/auth/session-relay`, `/api/register`, etc. | Autenticación |
| `webhooks` | `/api/webhooks/stripe`, `/api/webhooks/payu` | Webhooks de pago |

---

## 14. Schema Prisma Multi-File

El schema está dividido en `prisma/schema/`:

```
prisma/schema/
├── config.prisma      # generator + datasource
├── enums.prisma       # Todos los enums del sistema
├── auth.prisma        # User, Account, Session, VerificationToken
├── tenant.prisma      # Plan, Tenant, TenantUser, Invitation
├── business.prisma    # Client, Vehicle, ClientVehicle, ServiceType, ServiceOrder, OrderItem
├── billing.prisma     # Invoice, InvoiceItem, Payment, ScheduledPlanChange, PaymentReminder
└── onboarding.prisma  # OnboardingFlow, OnboardingStep, OnboardingFlowPlan, OnboardingFlowTenant, UserOnboardingCompletion
```

> **DB Sync**: Usar `prisma db push` (NO `prisma migrate dev`) — Supabase tiene drift de historial de migraciones.

### Relación Many-to-Many Client↔Vehicle

```prisma
// Vehicle NO tiene clientId directo
model ClientVehicle {
  clientId   String
  vehicleId  String
  tenantId   String
  @@unique([clientId, vehicleId])
}
```

Siempre validar que exista la junction `ClientVehicle(clientId, vehicleId, tenantId)` antes de crear una orden.

---

## 15. Reglas Arquitectónicas — Checklist

### ✅ SIEMPRE

- [ ] Importar desde `@/modules/{module}/index.ts` (barrel) si usas otro módulo
- [ ] Usar `requireAuth()` de `@/middleware/auth.middleware` en handlers
- [ ] Usar `requireTenantContext()` de `@/middleware/tenant.middleware` en handlers tenant
- [ ] Usar `handleXxxHttpError()` en el catch del handler
- [ ] Incluir `tenantId` en **todas** las queries a entidades tenant-scoped
- [ ] Usar `runTransaction()` para operaciones multi-tabla
- [ ] Pasar `database` (tx) a todos los repository calls dentro de una transacción
- [ ] Usar `ApiResponse.ok()` / `ApiResponse.created()` para respuestas exitosas
- [ ] Definir schemas Zod en `validations/{module}.validation.ts`
- [ ] Importar `prisma` únicamente desde `@/database/prisma`
- [ ] Usar `@/lib/payments/stripe` y `@/lib/payments/payu` para pagos
- [ ] Usar `@/lib/utils/domain` para utilidades de dominio/URL

### ❌ NUNCA

- [ ] Acceder a Prisma fuera de repositorios
- [ ] Poner lógica de negocio en handlers
- [ ] Devolver `Response` / `NextResponse` desde services
- [ ] Usar `@/lib/tenant` (archivo legacy eliminado)
- [ ] Usar `@/lib/prisma` (archivo legacy eliminado)
- [ ] Usar `@/lib/domain` (archivo legacy eliminado)
- [ ] Usar `@/lib/stripe` (archivo legacy eliminado)
- [ ] Usar `@/lib/payu` (archivo legacy eliminado)
- [ ] Hacer queries dentro de loops (N+1 problem)
- [ ] Ignorar el parámetro `database` en métodos de repositorio que participan en transacciones

---

## 16. lib/ — Estructura y Propósito

```
src/lib/
├── auth/
│   ├── config.ts         # NextAuth Credentials provider + rate limiting
│   └── index.ts          # auth(), handlers, signIn, signOut
│
├── database/
│   ├── index.ts
│   └── query-builder.ts  # buildTenantWhere(), QueryProfile, DatabaseInstance
│
├── email/
│   ├── index.ts
│   └── service.ts        # sendWelcomeEmail(), sendInvitationEmail()
│
├── http/
│   ├── client.ts         # fetchApi() — client-side con redirect 401
│   ├── errors.ts         # HttpError, UnauthorizedError, ForbiddenError, handleApiError()
│   ├── index.ts          # ApiResponse, HttpError, fetchApi
│   ├── module-error-factory.ts  # createModuleErrorClass(), createModuleErrorHandler()
│   └── response.ts       # ApiResponse class (ok, created, badRequest, notFound, etc.)
│
├── multitenancy/
│   ├── cookie.ts         # getSelectedTenant(), setSelectedTenant(), clearSelectedTenant()
│   ├── index.ts
│   ├── super-admin.ts    # associateSuperAdminsWithTenant()
│   └── tenant.ts         # requireTenant(), requireTenantMember(), TenantError, getTenantPlanStatus()
│
├── payments/
│   ├── index.ts
│   ├── invoice.ts        # createPlanInvoice(), markInvoicePaid(), calculateNextPeriod()
│   ├── payu.ts           # createPSEPayment(), createCreditCardPayment(), getPSEBanksList()
│   └── stripe.ts         # getStripe(), createCheckoutSession(), createBillingPortalSession()
│
├── security/
│   ├── index.ts
│   └── rate-limit.ts     # checkRateLimit() — in-memory, reemplazar por Upstash en prod
│
├── utils/
│   ├── api.ts            # fetchApi simplificado (server-safe, sin redirect)
│   ├── barrel.ts         # Re-exports de utils
│   ├── constants.ts      # ORDER_STATUS_LABELS, VEHICLE_TYPE_LABELS, ITEMS_PER_PAGE=10
│   ├── domain.ts         # getProtocol(), getCookieDomain(), buildTenantUrl(), extractTenantSlugFromHost()
│   ├── index.ts          # cn(), formatCurrency(), formatDate()
│   ├── normalization.ts  # normalizeText(), normalizePlate(), buildNormalizedPayload()
│   ├── order-number.ts   # generateOrderNumber()
│   └── validations.ts    # Schemas Zod de módulos + schemas auth/tenant (conveniencia)
│
├── validations/
│   └── shared.schema.ts  # Primitivos Zod reutilizables: idField, phoneField, paginationQuerySchema, etc.
│
└── index.ts              # Re-exports: http, auth, multitenancy, security
```

---

## 17. Onboarding (driver.js)

Sistema de tours guiados para introducir funcionalidades a nuevos usuarios.

### Uso en páginas

```tsx
// 1. Agregar componente de tour
<OnboardingTour flowKey="orders" />

// 2. Marcar elementos con data attribute
<Button data-onboarding="orders-new-btn">Nueva Orden</Button>
```

### Lógica de acceso

| Condición | Resultado |
|---|---|
| SUPER_ADMIN | Siempre ve todos los tours |
| Override de tenant activo | Usa el override (tiene/no tiene acceso) |
| Sin override → tiene fila en planAccess | Solo si el plan del tenant está listado |
| Sin override → sin filas en planAccess | Todos los planes tienen acceso |

### Seed

```bash
npx dotenv-cli -e .env -- npx tsx prisma/seed-onboarding.ts
```

---

## 18. Comandos Comunes

```bash
# Desarrollo
npm run dev                    # Start dev server (Turbopack)
npm run build                  # prisma generate + next build
npm run lint                   # ESLint

# Base de datos
npx prisma db push             # Sync schema → DB (sin migration history)
npx prisma generate            # Regenerar Prisma Client
npx tsx prisma/seed.ts         # Seed datos base

# Onboarding
npx dotenv-cli -e .env -- npx tsx prisma/seed-onboarding.ts

# Tests E2E
npx playwright test
```

---

## 19. Excepciones Documentadas

### stats module
El módulo `stats` (super admin dashboard) agrega datos de múltiples módulos (`orders`, `plans`, `tenants`, `users`). Su service importa directamente los repositorios de esos módulos en lugar de tener un repositorio propio, ya que es un módulo de **agregación pura** sin entidad propia. Esta es la única excepción al patrón de un repositorio por módulo.

### cron y webhooks
Los módulos `cron` y `webhooks` no tienen repositorios propios porque delegan completamente en servicios y repositorios de otros módulos (`tenant`, `billing`). Son módulos de **orquestación de procesos** sin datos propios.

---

*Última actualización: 2026-03-16*
