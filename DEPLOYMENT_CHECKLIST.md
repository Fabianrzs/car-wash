# 🚀 Deployment Checklist - Login Fix

## Problema Identificado
Login en producción (Vercel) devolvía `CredentialsSignin` aunque las credenciales sean válidas. Causa: conexión Prisma PG sin SSL en Supabase/managed DB.

## Cambios Aplicados
✅ `src/database/prisma.ts` - Habilitado SSL para conexiones no-localhost  
✅ `src/lib/auth/config.ts` - Normalización de email/credenciales + logging  
✅ Commits: `132c554`, `7b58fd0`

---

## ✅ POST-DEPLOYMENT CHECKLIST

### 1. Verificar Variables de Entorno en Vercel
Abre [Vercel Settings → Environment Variables](https://vercel.com/car-wash/settings/environment-variables) y confirma:

```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
AUTH_SECRET=[valor_largo_de_32_caracteres_mínimo]
AUTH_URL=https://car-wash-drab.vercel.app
NODE_ENV=production
```

**⚠️ Crítico:** 
- `DATABASE_URL` debe incluir `?sslmode=require` (Supabase auto-incluye esto)
- Si falta `?sslmode=require`, Prisma SSL fallará silenciosamente

### 2. Validar Endpoints Públicos (sin auth)
Si estos devuelven `500`, hay problema de DB aún:

```bash
# Esperado: 200 con JSON
curl -i https://car-wash-drab.vercel.app/api/plans

# Esperado: 200 con estadísticas
curl -i https://car-wash-drab.vercel.app/api/public-stats
```

Si siguen siendo `500`, revisar [Vercel Logs](https://vercel.com/car-wash/deployments):
- Buscar `[prisma]` o `[database]`
- Buscar `SSL` o `connection refused`

### 3. Probar Login con Credenciales Correctas

**IMPORTANTE:** La contraseña en seed es **`password123`** (para usuarios), **`superadmin123`** (para super admin).

```bash
# Reemplaza valores correctos de credenciales
curl -X POST 'https://car-wash-drab.vercel.app/api/auth/callback/credentials' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=superadmin%40carwash.com&password=superadmin123&mode=email&redirect=false&json=true'
```

**Respuestas esperadas:**
- ✅ `"ok": true` → login exitoso
- ❌ `"error": "CredentialsSignin"` → credencial no coincide O DB no conecta

### 4. Revisar Logs de Vercel para Diagnosticar

En [Vercel Logs](https://vercel.com/car-wash/deployments), busca:

```
[auth] user not found: { email: 'superadmin@carwash.com' }
  → Usuario no existe en DB. Ejecutar seed en producción.

[auth] password mismatch: { email: 'superadmin@carwash.com' }  
  → Contraseña incorrecta O hash de BD está corrupto.

[auth] authorize error: { email: 'superadmin@carwash.com', error: 'ENOTFOUND' }
  → Problema de DNS/red con DB. Revisar DATABASE_URL.

[auth] authorize error: { email: ..., error: 'SSL connection error' }
  → Problema SSL con Supabase. Confirmar ?sslmode=require en DATABASE_URL.
```

### 5. Si Logs Muestran "User Not Found"

El seed **no se ejecutó** en producción. Ejecuta en Supabase Studio o CLI:

```bash
# Opción A: Local contra DB de producción
DATABASE_URL="tu_production_url" npx tsx prisma/seed.ts

# Opción B: Via Vercel CLI
vercel env pull
npx tsx prisma/seed.ts
```

Después, intenta login nuevamente.

### 6. Si Logs Muestran "Password Mismatch"

Opciones:
- Contraseña incorrecta (seed usa `password123` y `superadmin123`)
- Hash de DB está corrompido o misma versión de bcrypt

Reseedea una cuenta de prueba:

```sql
-- En Supabase SQL Editor
UPDATE "User" 
SET password = '$2a$10$abc123...' -- Hash bcrypt de 'password123'
WHERE email = 'superadmin@carwash.com';
```

O simplemente reseedea toda la BD desde CLI.

---

## 🔄 Deploy Steps

```bash
# 1. Confirmar cambios están commiteados
git log --oneline -3

# 2. Push a origin/main (Vercel auto-deploya)
git push origin main

# 3. Esperar deploy en Vercel (~2 min)
# Revisar: https://vercel.com/car-wash/deployments

# 4. Después del deploy, ejecutar checklist arriba
```

---

## 📋 Quick Reference

| Problema | Solución |
|----------|----------|
| **500 en `/api/plans`** | SSL Prisma no activo. Revisar `DATABASE_URL` en Vercel. |
| **`CredentialsSignin` después de deploy** | Revisar logs Vercel. Si "user not found", ejecutar seed. |
| **Contraseña rechazada (seed correcta)** | Revisar bcrypt hash o reseedear BD. |
| **Rate limit exceeded** | Esperar 15 minutos o cambiar email/usuario. |

---

## 🆘 Soporte Rápido

Si después de estos pasos aún no funciona:

1. **Captura 3 líneas de logs de Vercel** del callback de auth
2. **Confirma `DATABASE_URL` es accesible** vía `psql` CLI
3. **Verifica la contraseña en plaintext** que usas vs. seed (case-sensitive)
4. Abre issue o contacta con esos detalles

