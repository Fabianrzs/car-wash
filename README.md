You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Instalación

```bash
# Instalar dependencias
npm install

# Generar Prisma Client
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Seed de datos
npm run prisma:seed
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3000
```

### Build para Producción

```bash
npm run build
npm start
```

---

## 🏗️ Estructura del Proyecto

```
src/
├── app/                 # Next.js App Router (pages + API routes)
├── modules/             # Dominios funcionales (clients, services, vehicles)
├── shared/              # 🆕 Código compartido centralizado
## Getting Started
First, run the development server:

Centraliza todo el código reutilizable:

- `http/` - HTTP responses, errors, client
- `auth/` - NextAuth configuration
- `multitenancy/` - Tenant resolution & cookies
- `security/` - Rate limiting
- `email/` - Email service
# or
yarn dev
# or
pnpm dev
# or
bun dev
3. **Vehicles** - CRUD de vehículos + asignación a clientes

### En Desarrollo

- Orders (órdenes de servicio)
- Billing (facturación y pagos)
- Team (gestión de equipo)
- Reports (reportes)
- Admin (panel de administración)

**[Ver ARCHITECTURE.md para crear nuevos módulos](./ARCHITECTURE.md)**

---

## 🔐 Autenticación y Multi-Tenancy

- **NextAuth.js** - Autenticación con credenciales
- **Multi-tenant** - Soporta múltiples lavaderos por usuario
- **Roles** - SUPER_ADMIN, ADMIN, MEMBER
- **Plans** - Trial, Pagado, Activo/Inactivo

---

## 💳 Integraciones

- **Stripe** - Pagos y subscripciones
You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
✅ **Build optimizado** - 0 errores, 0 warnings  

[Ver FINAL_REPORT.md para detalles completos](./FINAL_REPORT.md)

---

## 🤝 Contribuir

Consulta [ARCHITECTURE.md](./ARCHITECTURE.md) para:
- Patrones de módulos
## Learn More
- Mejores prácticas
- Checklist de code review

---

## 📞 Soporte

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
