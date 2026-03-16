import { NextResponse } from "next/server";
import { removeCartItem, replaceCartItemQuantity } from "@/lib/cart/service";
import { toErrorResponse } from "@/lib/api/errors";
import { getOptionalCustomer } from "@/lib/auth/customer";
import type { RouteContext } from "@/types/next";

interface CartProductParams {
  id_carrito: string;
  id_producto: string;
}

export async function PUT(request: Request, context: RouteContext<CartProductParams>) {
  try {
    const { id_carrito, id_producto } = await context.params;
    const customer = await getOptionalCustomer(request);
    const body = (await request.json()) as {
      cantidad?: number | string;
      medida?: string;
    };
    const items = await replaceCartItemQuantity(
      id_carrito,
      id_producto,
      body.cantidad ?? 0,
      body.medida,
      customer?.uid || null
    );

    return NextResponse.json({
      message: "Producto actualizado en el carrito",
      items,
    });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al actualizar el producto en el carrito");
  }
}

export async function DELETE(request: Request, context: RouteContext<CartProductParams>) {
  try {
    const { id_carrito, id_producto } = await context.params;
    const customer = await getOptionalCustomer(request);
    const medida = new URL(request.url).searchParams.get("medida");
    await removeCartItem(id_carrito, id_producto, medida, customer?.uid || null);

    return NextResponse.json({ message: "Producto eliminado del carrito" });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al eliminar el producto del carrito");
  }
}
