import { NextResponse } from "next/server";
import { addOrUpdateCartItem, getCartItems } from "@/lib/cart/service";
import { toErrorResponse } from "@/lib/api/errors";
import type { RouteContext } from "@/types/next";

interface CartParams {
  id_carrito: string;
}

export async function GET(_request: Request, context: RouteContext<CartParams>) {
  try {
    const { id_carrito } = await context.params;
    const items = await getCartItems(id_carrito);
    return NextResponse.json(items);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener los items del carrito");
  }
}

export async function POST(request: Request, context: RouteContext<CartParams>) {
  try {
    const { id_carrito } = await context.params;
    const body = (await request.json()) as { id_producto?: string; cantidad?: number | string };
    const items = await addOrUpdateCartItem(
      id_carrito,
      body.id_producto || "",
      body.cantidad ?? 0
    );

    return NextResponse.json(
      {
        message: "Producto agregado o actualizado en el carrito",
        items,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    return toErrorResponse(
      error,
      "Error al agregar o actualizar el producto en el carrito"
    );
  }
}
