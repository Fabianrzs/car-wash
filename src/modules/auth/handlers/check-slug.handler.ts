import { NextResponse } from "next/server";
import { isSlugAvailable } from "@/modules/auth/services/auth.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug requerido" }, { status: 400 });
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ available: false, reason: "Formato invalido" });
  }

  const result = await isSlugAvailable(slug);

  return NextResponse.json({
    available: result.available,
    reason: result.reason,
  });
}
