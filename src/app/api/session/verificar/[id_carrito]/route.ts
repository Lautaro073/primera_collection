import { NextResponse } from "next/server";
import { cartExists } from "@/lib/cart/service";
import { toErrorResponse } from "@/lib/api/errors";
import type { RouteContext } from "@/types/next";

interface SessionCartParams {
  id_carrito: string;
}

export async function GET(_request: Request, context: RouteContext<SessionCartParams>) {
  try {
    const { id_carrito } = await context.params;
    const result = await cartExists(id_carrito);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al consultar el carrito");
  }
}
