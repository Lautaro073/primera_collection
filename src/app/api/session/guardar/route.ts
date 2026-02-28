import { NextResponse } from "next/server";
import { saveCartId } from "@/lib/cart/service";
import { toErrorResponse } from "@/lib/api/errors";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { id_carrito?: string };
    const result = await saveCartId(body.id_carrito || "");
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al guardar el ID del carrito");
  }
}
