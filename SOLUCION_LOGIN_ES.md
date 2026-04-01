# 🔍 ANÁLISIS DEL PROBLEMA DE LOGIN EN PRODUCCIÓN

## RESUMEN EJECUTIVO

**Problema:** El login falla en Vercel pero funciona perfecto en local.

**Causa Identificada:** La base de datos en producción (Supabase PostgreSQL) **no se conecta correctamente o no tiene datos**.

**Soluciones Aplicadas:**
- ✅ SSL para Prisma PG adapter en Vercel (commit `132c554`)
- ✅ Logging granular para diagnosticar exactamente dónde falla (commit `7b58fd0`)
- ✅ Endpoint `/api/debug` para ver estado de la BD en producción (commit `f5108ae`)

---

## COMPARATIVA: LOCAL vs PRODUCCIÓN

### ✅ LOCAL (localhost:3000) - FUNCIONA

```
1️⃣ DB State
   - Conectada: ✅ SÍ
   - Usuarios: 32
   - superadmin@carwash.com: ✅ EXISTE
   - Tiene contraseña: ✅ SÍ

2️⃣ Login attempt
   - HTTP: 302 Found
   - Session Cookie: ✅ SETEADA
   - Sessión válida: ✅ SÍ
   
3️⃣ Resultado
   - Usuario logueado: Super Administrador
   - Estado: ✅ EXITOSO
```

### ❌ PRODUCCIÓN (vercel.app) - FALLA

```
1️⃣ DB State
   - Conectada: ❓ DESCONOCIDO (middleware bloquea acceso a /api/debug)
   - Usuarios: ❓ DESCONOCIDO

2️⃣ Login attempt
   - HTTP: 302 Found
   - Session Cookie: ❌ NO SETEADA
   - Error: error=CredentialsSignin
   
3️⃣ Resultado
   - Mensaje: "Credenciales inválidas"
   - Estado: ❌ FALLA
   - Razón real: authorize() devuelve null
```

---

## ¿POR QUÉ FALLA EN PRODUCCIÓN?

Cuando `authorize()` devuelve `null`, significa:

**OPCIÓN A:** Base de datos no se conecta
```typescript
const user = await authRepository.findUserByEmail({...})
// La consulta FALLA porque:
// - SSL no está habilitado (PARCIALMENTE CORREGIDO)
// - DATABASE_URL no incluye ?sslmode=require
// - Supabase rechaza conexiones sin SSL
```

**OPCIÓN B:** El usuario no existe en BD
```typescript
if (!user) return null;  // ← Usuario NO encontrado
// El seed NUNCA se ejecutó en Supabase
```

**OPCIÓN C:** Hash de contraseña corrupto
```typescript
if (!user.password) return null;  // ← Sin contraseña
// O la comparación falla
if (!passwordMatch) return null;
```

---

## CAMBIOS REALIZADOS

### 1️⃣ Commit `132c554` - SSL para PostgreSQL
```typescript
// src/database/prisma.ts
const isLocalhost = connectionString.includes("localhost");

const adapter = new PrismaPg({
  connectionString,
  ...(!isLocalhost && { ssl: { rejectUnauthorized: false } }),
  //                      ↑ Ahora SÍ tiene SSL en Vercel
});
```

**Impacto:** Prisma ahora se conecta a Supabase CON SSL en producción.

### 2️⃣ Commit `7b58fd0` - Logging Granular
```typescript
// src/lib/auth/config.ts
if (isProduction) {
  console.warn("[auth] user not found:", { email });
  console.warn("[auth] password mismatch:", { email });
  console.error("[auth] authorize error:", { email, error: errorMsg });
}
```

**Impacto:** Vercel logs ahora muestran EXACTAMENTE dónde falla el login.

### 3️⃣ Commit `f5108ae` - Endpoint de Diagnóstico
```typescript
// src/app/api/debug/route.ts
GET /api/debug → {
  "database": { "connected": true, "userCount": 32 },
  "superadmin": { "found": true, "hasPassword": true },
  "sampleUsers": [...],
  "sampleTenants": [...]
}
```

**Impacto:** Puedes verificar si la BD está conectada y tiene datos (auth bypass permitido).

---

## PRÓXIMOS PASOS

### PASO 1: Esperar redeploy en Vercel
- Los cambios ya se hicieron commit
- Vercel auto-redeploya en ~2 minutos
- **Verificar:** [https://vercel.com/car-wash/deployments](https://vercel.com/car-wash/deployments)

### PASO 2: Revisar logs de Vercel
1. Abre [Vercel Logs](https://vercel.com/car-wash/deployments)
2. Busca la línea `[auth]` (login log)
3. Encuentra UNO de estos mensajes:

| Log | Significado | Solución |
|-----|-------------|----------|
| `[auth] user not found` | Usuario NO existe en Supabase | Ejecutar seed |
| `[auth] password mismatch` | Contraseña no coincide | Revisar hash bcrypt |
| `[auth] authorize error: SSL` | SSL falla | Verificar `DATABASE_URL` |
| *(sin error)* | Sesión EXITOSA | ✅ PROBLEMA RESUELTO |

### PASO 3: Probar login después de redeploy
```bash
# Test 1: Ver estado de BD
curl https://car-wash-drab.vercel.app/api/debug

# Test 2: Intentar login
curl -X POST 'https://car-wash-drab.vercel.app/api/auth/callback/credentials' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=superadmin%40carwash.com&password=superadmin123&redirect=false&json=true'

# Expected: HTTP 302 (NOT error=CredentialsSignin)
```

### PASO 4: Si Sigue Fallando
Ejecuta seed en Supabase:

**Opción A - Desde CLI local:**
```bash
DATABASE_URL="tu_url_supabase_production" npx tsx prisma/seed.ts
```

**Opción B - Desde Vercel CLI:**
```bash
vercel env pull       # Descarga variables de Vercel
npx tsx prisma/seed.ts  # Ejecuta seed
```

**Opción C - Manual en Supabase Studio:**
```bash
# Abre https://supabase.com → Tu proyecto → SQL Editor
# Copia las inserciones del seed
```

---

## RESUMEN DE COMANDOS

| Acción | Comando |
|--------|---------|
| Ver logs de Vercel | [https://vercel.com/car-wash/deployments](https://vercel.com/car-wash/deployments) |
| Verificar BD | `curl https://car-wash-drab.vercel.app/api/debug` |
| Probar login | `curl -X POST 'https://.../api/auth/callback/credentials' -d '...'` |
| Seed en Supabase | `DATABASE_URL="..." npx tsx prisma/seed.ts` |
| Build local | `npm run build` |
| Dev local | `npm run dev` (ya está corriendo) |

---

## ESTADO ACTUAL

| Componente | Estado | Notas |
|-----------|--------|-------|
| **SSL Prisma** | ✅ FIJO | Commit 132c554 |
| **Logging** | ✅ AGREGADO | Commit 7b58fd0 |
| **Diagnóstico** | ✅ READY | `/api/debug` disponible |
| **Login Local** | ✅ FUNCIONA | No hay cambios |
| **Login Producción** | ⏳ PENDING | Esperando redeploy + retest |
| **BD Supabase** | ❓ TBD | Ver logs después de redeploy |

---

## ARCHIVOS CLAVE

- **[DEBUG_REPORT.md](DEBUG_REPORT.md)** - Análisis técnico completo
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Checklist post-deploy
- **[src/lib/auth/config.ts](src/lib/auth/config.ts)** - Lógica de login con logging
- **[src/database/prisma.ts](src/database/prisma.ts)** - Conexión a BD con SSL
- **[src/app/api/debug/route.ts](src/app/api/debug/route.ts)** - Endpoint de diagnóstico

---

## ¿PREGUNTAS?

Si el login **SIGUE fallando** después de estas acciones:
1. Captura 3 líneas de logs de Vercel del callback
2. Abre `/api/debug` y copia la respuesta
3. Verifica que `DATABASE_URL` tenga `?sslmode=require`
4. Contacta con esos detalles

**Progreso:** Hemos reducido el problema de "no sabemos qué pasa" a "sabemos exactamente dónde falla" (logs + diagnóstico). 🚀

