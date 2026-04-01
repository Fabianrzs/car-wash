# 🎯 CAUSA RAÍZ ENCONTRADA: ENV VARS EN VERCEL

## HALLAZGO CRÍTICO

**Local con BD Supabase = ✅ LOGIN FUNCIONA**  
**Vercel con BD Supabase = ❌ LOGIN FALLA**

Esto prueba que el problema es **NextAuth configuration**, NO la base de datos.

---

## VARIABLES REQUERIDAS EN VERCEL

### Verificar en: https://vercel.com/car-wash/settings/environment-variables

```
AUTH_SECRET=                  ← Debe existir (clave para JWT)
AUTH_URL=https://car-wash-drab.vercel.app  ← DEBE SER EXACTA
AUTH_TRUST_HOST=true          ← Debe existir
DATABASE_URL=postgresql://... ← Ya existe ✓
NODE_ENV=production           ← Probablemente OK
```

### En LOCAL tiene:
```
AUTH_SECRET="car-wash-secret-key-change-in-production"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
DATABASE_URL="postgresql://..."
```

---

## PROBLEMA PROBABLE

Vercel **NO tiene AUTH_SECRET o AUTH_URL configuradas correctamente**.

### Consecuencia:
- NextAuth en Vercel NO puede crear sesiones JWT
- Incluso si `authorize()` retorna usuario válido, la sesión no se guarda
- Resultado: Redirect a `/login?error=CredentialsSignin`

---

## SOLUCIÓN: CONFIGURAR ENV VARS EN VERCEL

### Paso 1: Generar AUTH_SECRET

```bash
# En local, genera una clave segura:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# O usa esta (para testing, cámbiala en prod):
AUTH_SECRET="$(openssl rand -hex 32)"
```

### Paso 2: Ve a Vercel Settings
```
https://vercel.com/car-wash/settings/environment-variables
```

### Paso 3: Agrega Variables
```
AUTH_SECRET = "tu_clave_generada_arriba"
AUTH_URL = "https://car-wash-drab.vercel.app"
AUTH_TRUST_HOST = "true"
```

### Paso 4: Redeploy
```
Vercel auto-redeploya cuando cambias environment variables
O manual: Click "Redeploy" en deployments
```

### Paso 5: Test Login
```bash
/tmp/test_login.sh https://car-wash-drab.vercel.app
# Esperado: Session válida ✅
```

---

## VERIFICACIÓN RÁPIDA

Para confirmar que esto es el problema, corre en Vercel logs:

```
Si ves: "JWT malformed" o "Cannot verify JWT"
  → Confirma que es AUTH_SECRET

Si ves: "url must start with http"  
  → Confirma que es AUTH_URL
```

---

## CHECKLIST

```
□ Generar AUTH_SECRET: openssl rand -hex 32
□ Ir a https://vercel.com/car-wash/settings/environment-variables
□ Agregar AUTH_SECRET
□ Agregar AUTH_URL = https://car-wash-drab.vercel.app
□ Agregar AUTH_TRUST_HOST = true
□ Esperar redeploy
□ Test: /tmp/test_login.sh https://car-wash-drab.vercel.app
```

---

**Diagnóstico:** ENV vars incompletas en Vercel  
**Solución:** 5 minutos configurar + redeploy automático  
**Esperado:** Login funciona ✅

