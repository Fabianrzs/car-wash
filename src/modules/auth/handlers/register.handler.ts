import { NextResponse } from "next/server";
import { registerSchema } from "@/modules/auth/validations/auth.validation";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { isEmailTaken, isSlugAvailable } from "@/modules/auth/services/auth.service";
import { registerUserService } from "@/modules/auth/services/register.service";

export async function POST(request: Request) {
  // Rate limit: 10 registration attempts per IP per hour
  const ip = getClientIp(request);
  const rl = checkRateLimit(`register:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en una hora." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check email not taken
    const emailTaken = await isEmailTaken(validatedData.email);
    if (emailTaken) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 400 }
      );
    }

    // Check slug available
    const slugResult = await isSlugAvailable(validatedData.businessSlug);
    if (!slugResult.available) {
      return NextResponse.json(
        { error: "El slug del lavadero ya esta en uso" },
        { status: 400 }
      );
    }

    const result = await registerUserService(validatedData);

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de registro invalidos", details: error },
        { status: 400 }
      );
    }

    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
