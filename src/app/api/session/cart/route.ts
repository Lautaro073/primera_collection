import { NextResponse } from "next/server";
import { syncCartSession } from "@/lib/cart/service";
import { toErrorResponse } from "@/lib/api/errors";
import { getOptionalCustomer } from "@/lib/auth/customer";

interface CartSessionPayload {
  id_carrito?: unknown;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CartSessionPayload;
    const cartId = typeof payload.id_carrito === "string" ? payload.id_carrito.trim() : "";
    const customer = await getOptionalCustomer(request);
    const session = await syncCartSession(cartId || null, customer?.uid || null);

    return NextResponse.json(session, { status: session.restored ? 200 : 201 });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al iniciar la sesion del carrito");
  }
}
