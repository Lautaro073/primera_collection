import { NextResponse } from "next/server";
import { cartExists, createCart } from "@/lib/cart/service";
import { toErrorResponse } from "@/lib/api/errors";

interface CartSessionPayload {
  id_carrito?: unknown;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CartSessionPayload;
    const cartId = typeof payload.id_carrito === "string" ? payload.id_carrito.trim() : "";

    if (cartId) {
      const exists = await cartExists(cartId);

      if (exists.exists) {
        return NextResponse.json({ id_carrito: cartId, restored: true });
      }
    }

    const cart = await createCart();
    return NextResponse.json({ ...cart, restored: false }, { status: 201 });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al iniciar la sesion del carrito");
  }
}
