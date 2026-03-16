import { NextResponse } from "next/server";
import { registerInviteSchema } from "@/modules/auth/validations/auth.validation";
import { registerInviteUserService } from "@/modules/auth/services/register.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerInviteSchema.parse(body);

    await registerInviteUserService(validatedData);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      const status =
        error.message.includes("no encontrada") ? 404 :
        error.message.includes("expirado") ||
        error.message.includes("aceptada") ||
        error.message.includes("email")
          ? 400
          : 500;

      if (status !== 500) {
        return NextResponse.json({ error: error.message }, { status });
      }
    }

    console.error("Error en registro por invitación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
