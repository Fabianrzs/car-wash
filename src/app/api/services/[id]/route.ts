import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serviceTypeSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const service = await prisma.serviceType.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error al obtener servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta accion" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = serviceTypeSchema.parse(body);

    const existingService = await prisma.serviceType.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    const duplicateName = await prisma.serviceType.findFirst({
      where: {
        name: validatedData.name,
        id: { not: id },
      },
    });

    if (duplicateName) {
      return NextResponse.json(
        { error: "Ya existe otro servicio con ese nombre" },
        { status: 400 }
      );
    }

    const service = await prisma.serviceType.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        price: validatedData.price,
        duration: validatedData.duration,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de servicio invalidos", details: error },
        { status: 400 }
      );
    }

    console.error("Error al actualizar servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta accion" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existingService = await prisma.serviceType.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    await prisma.serviceType.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Servicio desactivado correctamente",
    });
  } catch (error) {
    console.error("Error al desactivar servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
