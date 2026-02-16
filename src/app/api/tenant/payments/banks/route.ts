import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPSEBanksList } from "@/lib/payu";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const banks = await getPSEBanksList();
    return NextResponse.json(banks);
  } catch (error) {
    console.error("Error al obtener bancos PSE:", error);
    // Return empty array so the UI can fall back to credit card
    return NextResponse.json([]);
  }
}
