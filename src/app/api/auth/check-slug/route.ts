import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug requerido" }, { status: 400 });
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ available: false, reason: "Formato invalido" });
  }

  const reserved = ["admin", "api", "app", "www", "mail", "ftp", "blog", "help", "support"];
  if (reserved.includes(slug)) {
    return NextResponse.json({ available: false, reason: "Slug reservado" });
  }

  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });

  return NextResponse.json({
    available: !existingTenant,
    reason: existingTenant ? "Ya esta en uso" : null,
  });
}
