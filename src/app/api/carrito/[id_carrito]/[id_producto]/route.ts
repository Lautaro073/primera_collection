import { NextResponse } from "next/server";
import { removeCartItem, replaceCartItemQuantity } from "@/lib/cart/service";
import { toErrorResponse } from "@/lib/api/errors";
import type { RouteContext } from "@/types/next";

interface CartProductParams {
  id_carrito: string;
  id_producto: string;
}

export async function PUT(request: Request, context: RouteContext<CartProductParams>) {
  try {
    const { id_carrito, id_producto } = await context.params;
    const body = (await request.json()) as { cantidad?: number | string };
    const items = await replaceCartItemQuantity(
      id_carrito,
      id_producto,
      body.cantidad ?? 0
    );

    return NextResponse.json({
      message: "Producto actualizado en el carrito",
      items,
    });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al actualizar el producto en el carrito");
  }
}

export async function DELETE(_request: Request, context: RouteContext<CartProductParams>) {
  try {
    const { id_carrito, id_producto } = await context.params;
    await removeCartItem(id_carrito, id_producto);

    return NextResponse.json({ message: "Producto eliminado del carrito" });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al eliminar el producto del carrito");
  }
}
