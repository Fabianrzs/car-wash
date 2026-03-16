import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { acceptInvitationForUserService } from "@/modules/tenant/services/invitations.service";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    const result = await acceptInvitationForUserService(token, session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      const status =
        error.message.includes("no encontrada") ? 404 :
        error.message.includes("expirada") ||
        error.message.includes("aceptada") ||
        error.message.includes("miembro")
          ? 400
          : 500;

      if (status !== 500) {
        return NextResponse.json({ error: error.message }, { status });
      }
    }
    console.error("Error al aceptar invitacion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
