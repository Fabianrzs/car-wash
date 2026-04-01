# 🔍 DEBUG REPORT: Login Flow Analysis (Local vs Production)

## EXECUTIVE SUMMARY

**DIAGNOSIS:** Production deployment has a **database connectivity or seed data issue**. The `authorize()` callback returns `null` when credentials reach Vercel, indicating either:
1. **Database connection fails** (SSL/network issue with Supabase)
2. **User data not seeded** in production database

Local login works perfectly because SQLite seed is pre-populated locally.

---

## DETAILED COMPARISON

### Test Credentials
- Email: `superadmin@carwash.com`
- Password: `superadmin123`

### Test Results

#### ✅ LOCAL (http://localhost:3000)
```json
{
  "database": {
    "connected": true,
    "userCount": 32,
    "tenantCount": 11
  },
  "superadmin": {
    "found": true,
    "name": "Super Administrador",
    "email": "superadmin@carwash.com",
    "globalRole": "SUPER_ADMIN",
    "hasPassword": true
  }
}
```

**Login Response:**
```
HTTP/1.1 302 Found
location: http://localhost:3000
set-cookie: next-auth.session-token=eyJhbGci...

Session: {
  "user": { "name": "Super Administrador", "email": "superadmin@carwash.com", "globalRole": "SUPER_ADMIN" },
  "expires": "2026-05-01T02:39:21.658Z"
}
```

**Status:** ✅ **WORKS PERFECTLY**

---

#### ❌ PRODUCTION (https://car-wash-drab.vercel.app)
```
DEBUG ENDPOINT RESULT: "Redirecting..." (middleware blocks access)
```

**Login Response:**
```
HTTP/2 302 
location: https://car-wash-drab.vercel.app/login?error=CredentialsSignin&code=credentials
(NO session cookie)

Session: null
```

**Status:** ❌ **BROKEN - authorize() returns null**

---

## ROOT CAUSE

### Why `authorize()` Returns Null

When `authorize(credentials)` returns `null`, it means ONE of these is true:

1. **User query fails** (can't reach DB)
   ```typescript
   const user = await authRepository.findUserByEmail({...})
   // If this throws or returns null → login fails
   ```

2. **User doesn't exist** in production DB
   ```typescript
   if (!user) return null;  // ← This path taken
   ```

3. **Password hash is missing or corrupted**
   ```typescript
   if (!user.password) return null;  // ← Or this path
   ```

4. **bcrypt.compare() fails**
   ```typescript
   const passwordMatch = await bcrypt.compare(password, user.password)
   if (!passwordMatch) return null;  // ← Or this path
   ```

### Evidence Analysis

**Local DB State:** ✅
- User count: 32
- Superadmin found: YES
- Has password: YES
- All seed data loaded

**Production DB State:** ❓ UNKNOWN
- Can't access `/api/debug` (middleware blocks it)
- But we know login fails, suggesting either:
  - **Seed never ran** (user not found)
  - **Connection failure** (SSL issue now partially fixed)

---

## FIXES APPLIED

### Commit 132c554
```typescript
// src/database/prisma.ts
const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const adapter = new PrismaPg({
  connectionString,
  ...(!isLocalhost && { ssl: { rejectUnauthorized: false } }),
});
```
✅ **SSL enabled for Vercel/Supabase connections**

### Commit 7b58fd0
```typescript
// src/lib/auth/config.ts
const email = (credentials?.email as string | undefined)?.trim().toLowerCase() ?? "";

if (isProduction) {
  console.warn("[auth] user not found:", { email });
  console.warn("[auth] password mismatch:", { email });
  console.error("[auth] authorize error:", { email, error: errorMsg });
}
```
✅ **Granular logging added for production debugging**

---

## NEXT STEPS

### 1. **Wait for Vercel Redeploy**
The SSL fix is now deployed. Vercel auto-redeploys on push:
- Monitor: [Vercel Deployments](https://vercel.com/car-wash/deployments)
- Expected: Build succeeds, functions updated

### 2. **Check Logs After Redeploy**
Once new code is live, attempt login and check logs for:
```
[auth] user not found: { email: 'superadmin@carwash.com' }
[auth] authorize error: { email: '...', error: 'SSL ...' }
```

### 3. **If Still Broken**
Three possible causes:

#### Cause A: Seed Never Executed
```bash
# Manually seed production database
DATABASE_URL="your_supabase_url" npx tsx prisma/seed.ts

# Or via Vercel CLI
vercel env pull
npx tsx prisma/seed.ts
```

#### Cause B: Email Mismatch
Database may have `SUPERADMIN@CARWASH.COM` (uppercase):
```sql
SELECT DISTINCT(email) FROM "User" LIMIT 10;
```

#### Cause C: SSL Still Not Working
Verify `DATABASE_URL` in Vercel includes `?sslmode=require`:
```
postgresql://user:pass@db.supabase.co:5432/postgres?sslmode=require
```

---

## COMPARISON TABLE

| Metric | Local | Production | Action |
|--------|-------|-----------|--------|
| **DB Connected** | ✅ YES | ❓ UNKNOWN | Check logs after deploy |
| **User Found** | ✅ YES | ❌ LIKELY NO | Seed if missing |
| **SSL Enabled** | N/A | ✅ NOW YES (commit 132c554) | Monitor errors |
| **Login Works** | ✅ YES | ❌ NO | Wait for redeploy + retest |

---

## CREDENTIALS FOR TESTING

**Super Admin:**
- Email: `superadmin@carwash.com`
- Password: `superadmin123`

**Demo Tenant Owner:**
- Email: `carlos@demo-carwash.com`
- Password: `password123`

---

## TEST COMMAND

After Vercel redeploy, run:
```bash
curl -X POST 'https://car-wash-drab.vercel.app/api/auth/callback/credentials' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=superadmin%40carwash.com&password=superadmin123&mode=email&redirect=false&json=true'
```

**Expected:** HTTP 302 with session cookie (NOT error=CredentialsSignin)

---

**Generated:** 2026-03-31 02:40 UTC  
**Status:** INVESTIGATING

