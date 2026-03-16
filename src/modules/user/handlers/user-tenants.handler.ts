import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserTenantsService } from "@/modules/user/services/user-tenants.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenants = await getUserTenantsService(session.user.id);

  return NextResponse.json({ tenants });
}
