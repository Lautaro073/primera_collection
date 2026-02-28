import { NextResponse } from "next/server";
import { createAnonymousSessionId } from "@/lib/cart/service";
import { toErrorResponse } from "@/lib/api/errors";

export async function GET() {
  try {
    return NextResponse.json({ sessionId: createAnonymousSessionId() });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al generar la sesion");
  }
}
