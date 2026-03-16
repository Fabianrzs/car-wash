import { NextResponse } from "next/server";

interface ErrorBody {
  error: string;
  details?: unknown;
}

export class ApiResponse {
  static ok<T>(data: T) {
	return NextResponse.json(data, { status: 200 });
  }

  static created<T>(data: T) {
	return NextResponse.json(data, { status: 201 });
  }

  static badRequest(message = "Solicitud invalida", details?: unknown) {
	const body: ErrorBody = { error: message, ...(details !== undefined ? { details } : {}) };
	return NextResponse.json(body, { status: 400 });
  }

  static unauthorized(message = "No autorizado") {
	return NextResponse.json<ErrorBody>({ error: message }, { status: 401 });
  }

  static forbidden(message = "No tienes permisos para realizar esta accion") {
	return NextResponse.json<ErrorBody>({ error: message }, { status: 403 });
  }

  static notFound(message = "Recurso no encontrado") {
	return NextResponse.json<ErrorBody>({ error: message }, { status: 404 });
  }

  static serverError(message = "Error interno del servidor") {
	return NextResponse.json<ErrorBody>({ error: message }, { status: 500 });
  }
}


