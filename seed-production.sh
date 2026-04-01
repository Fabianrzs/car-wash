#!/bin/bash

# Script para ejecutar seed en Supabase (producción)
# Uso: ./seed-production.sh [DATABASE_URL]

set -e

echo "============================================"
echo "🌱 SEED PRODUCTION DATABASE"
echo "============================================"
echo ""

if [ -z "$1" ]; then
  echo "❌ ERROR: DATABASE_URL no proporcionada"
  echo ""
  echo "Uso:"
  echo "  ./seed-production.sh \"postgresql://user:pass@host:5432/db?...\""
  echo ""
  echo "Para obtener DATABASE_URL:"
  echo "  1. Ve a https://vercel.com/car-wash/settings/environment-variables"
  echo "  2. Busca DATABASE_URL"
  echo "  3. Cópiala completa"
  echo "  4. Pega en este script"
  echo ""
  exit 1
fi

DATABASE_URL="$1"

echo "Usando DATABASE_URL:"
echo "  postgresql://[user]:[pass]@[host]:5432/[db]"
echo ""

echo "Ejecutando seed..."
DATABASE_URL="$DATABASE_URL" npx tsx prisma/seed.ts

if [ $? -eq 0 ]; then
  echo ""
  echo "============================================"
  echo "✅ SEED EXITOSO"
  echo "============================================"
  echo ""
  echo "Próximos pasos:"
  echo "  1. Intenta login en https://car-wash-drab.vercel.app"
  echo "  2. Email: superadmin@carwash.com"
  echo "  3. Password: superadmin123"
  echo ""
else
  echo ""
  echo "============================================"
  echo "❌ ERROR EN SEED"
  echo "============================================"
  echo ""
  echo "Posibles causas:"
  echo "  - DATABASE_URL incorrea"
  echo "  - Conexión a Supabase rechazada"
  echo "  - Problemas de permiso"
  echo ""
  exit 1
fi

