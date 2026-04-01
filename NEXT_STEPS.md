# ⚡ NEXT STEPS - ACTION ITEMS (Inmediatos)

## TIMELINE ESTIMADO

| Acción | Tiempo | Status |
|--------|--------|--------|
| Vercel redeploy automático | ~2 min | ⏳ WAITING |
| Verificar deployment exitoso | 1 min | ⏳ WAITING |
| Verificar `/api/debug` | 1 min | ⏳ WAITING |
| Probar login (test script) | 1 min | ⏳ WAITING |
| Revisar logs Vercel si falla | 5 min | ⏳ IF NEEDED |
| Ejecutar seed si requerido | 5-10 min | ⏳ IF NEEDED |

**Total esperado:** 5 minutos si todo OK, 15-20 si hay que ejecutar seed.

---

## PASO 1️⃣: VERCEL AUTO-DEPLOY (2 min)

**Qué está pasando:**
- Git commits ya pusheados a main
- Vercel webhook triggered automáticamente
- Build en progreso

**Verificar:**
1. Abre [Vercel Deployments](https://vercel.com/car-wash/deployments)
2. Busca build más reciente (debería estar "Building" o "Ready")
3. Espera estado: `✅ Ready` (azul checkmark)

**Si hay error:** Revisa logs del build en Vercel

---

## PASO 2️⃣: VERIFICAR DEPLOYMENT EXITOSO (1 min)

```bash
# Verificar que la app responde
curl -i https://car-wash-drab.vercel.app

# Esperado: HTTP/2 200 o 308 (redirect a /login)
```

---

## PASO 3️⃣: PROBAR ENDPOINT DE DEBUG (1 min)

```bash
curl https://car-wash-drab.vercel.app/api/debug | python3 -m json.tool

# Busca en la respuesta:
# 1. "connected": true ← BD conecta
# 2. "userCount": > 0 ← Hay datos
# 3. "superadmin": { "found": true } ← Usuario existe
```

**Interpretación:**
- ✅ Si `connected: true` y `userCount > 0` → BD está OK, posible que sea seed
- ❌ Si `error: "DB connection failed"` → SSL aún no funciona
- ❌ Si `userCount: 0` → Seed nunca se ejecutó

---

## PASO 4️⃣: TEST LOGIN (1 min)

```bash
# Opción A: Usar script creado
/tmp/test_login.sh https://car-wash-drab.vercel.app

# Opción B: Manual
curl -X POST 'https://car-wash-drab.vercel.app/api/auth/callback/credentials' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=superadmin%40carwash.com&password=superadmin123&redirect=false&json=true'

# Busca en output:
# - HTTP 302 OK ✅
# - location: (CUALQUIER cosa EXCEPTO error=CredentialsSignin) ✅
# - Session != null ✅
```

**Resultados esperados:**

| Resultado | Significado | Próximo Paso |
|-----------|-------------|-------------|
| Session válida | ✅ ÉXITO | Celebra 🎉 |
| `error=CredentialsSignin` | ❌ Aún falla | Ir a PASO 5 |
| `DB connection failed` | ❌ SSL no funciona | Revisar DATABASE_URL |
| `user not found` | ❌ Sin seed | Ejecutar seed (PASO 5B) |

---

## PASO 5️⃣: DIAGNOSTICAR SI FALLA (5 min)

### 5A - Revisar Logs Vercel
1. Abre [Vercel Logs](https://vercel.com/car-wash/deployments)
2. Selecciona el deployment más reciente
3. Click en "Functions" tab
4. Busca texto `[auth]`
5. Lee el mensaje:

```
[auth] user not found: { email: 'superadmin@carwash.com' }
    → Usuario NO existe. Ir a 5B (ejecutar seed)

[auth] password mismatch: { email: 'superadmin@carwash.com' }
    → Contraseña incorrecta o hash corrupto. Revisar BD.

[auth] authorize error: { email: '...', error: 'SSL' }
    → SSL aún no funciona. Revisar DATABASE_URL en Vercel.

(sin [auth] messages)
    → Probablemente sesión OK, pero revisar /api/auth/session
```

### 5B - Ejecutar Seed en Producción (5-10 min)

Si logs dicen `user not found`:

**Opción A: Desde CLI local (MÁS SEGURO)**
```bash
# 1. Obtener DATABASE_URL de Vercel
#    (Settings → Environment Variables → DATABASE_URL)
#    Copiar el valor

# 2. Ejecutar seed
DATABASE_URL="postgresql://user:pass@db.supabase.co:5432/postgres?..." npx tsx prisma/seed.ts

# 3. Esperar ~30 seg (crea usuarios, tenants, planes)
#    Output: "Seed completado exitosamente"

# 4. Volver a PASO 4 (re-test login)
```

**Opción B: Desde Vercel CLI**
```bash
# 1. Pull environment variables
vercel env pull

# 2. Run seed
npx tsx prisma/seed.ts

# 3. Volver a PASO 4 (re-test login)
```

---

## CHECKLIST RÁPIDO

```
□ Abre https://vercel.com/car-wash/deployments
□ Espera "Ready" (green checkmark)
□ Corre: curl https://car-wash-drab.vercel.app/api/debug
  □ ✅ connected: true Y userCount > 0 → OK
  □ ❌ Error OR userCount = 0 → Ejecutar seed
□ Corre: /tmp/test_login.sh https://car-wash-drab.vercel.app
  □ ✅ Session válida → ÉXITO 🎉
  □ ❌ error=CredentialsSignin → Revisar logs Vercel + seed
□ Si falla aún, ejecuta seed (opción A o B)
□ Re-test login
```

---

## ARCHIVOS DE REFERENCIA

Abrir según necesidad:

| Archivo | Cuándo | Qué Contiene |
|---------|--------|------------|
| [SOLUCION_LOGIN_ES.md](SOLUCION_LOGIN_ES.md) | **SIEMPRE** | Guía completa en español |
| [DEBUG_REPORT.md](DEBUG_REPORT.md) | Si quieres entender | Análisis técnico |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Post-deploy | Checklist de ENV vars |
| [RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md) | Overview rápido | Summary de cambios |

---

## CREDENCIALES DE TEST

```
Email: superadmin@carwash.com
Password: superadmin123

Email: carlos@demo-carwash.com
Password: password123
```

---

## CONTACTO / ESCALACIÓN

Si **después de todo esto** aún no funciona:

1. Captura **3 líneas de logs** de Vercel (sección `[auth]`)
2. Copia salida de `/api/debug`
3. Verifica `DATABASE_URL` en Vercel contiene `?sslmode=require`
4. Abre issue con esos detalles

---

## ⏱️ EMPEZAR AHORA

1. Abre [Vercel Deployments](https://vercel.com/car-wash/deployments)
2. Espera "Ready" ← **ESPERAR AQUÍ** (~2 min)
3. Luego ejecuta:
   ```bash
   /tmp/test_login.sh https://car-wash-drab.vercel.app
   ```

---

**Última actualización:** 2026-03-31 02:42 UTC  
**Commits listos:** 132c554, 7b58fd0, f5108ae, c6c1ed6  
**Status:** AWAITING VERCEL REDEPLOY ⏳

