import { NextResponse } from "next/server";
import { createCart } from "@/lib/cart/service";
import { toErrorResponse } from "@/lib/api/errors";

export async function POST() {
  try {
    const cart = await createCart();
    return NextResponse.json(cart);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al crear un nuevo carrito");
  }
}
