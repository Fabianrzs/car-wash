import { NextResponse } from "next/server";
import { getInvitationByTokenService } from "@/modules/invite/services/invite.service";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const invitation = await getInvitationByTokenService(token);
    return NextResponse.json(invitation);
  } catch (error) {
    if (error instanceof Error) {
      const status =
        error.message.includes("no encontrada") ? 404 :
        error.message.includes("aceptada") || error.message.includes("expirado") ? 400 : 500;

      if (status !== 500) {
        return NextResponse.json({ error: error.message }, { status });
      }
    }

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
