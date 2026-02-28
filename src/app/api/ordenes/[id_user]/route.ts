import { NextResponse } from "next/server";
import { createOrder, listOrdersByUser } from "@/lib/orders/service";
import { toErrorResponse } from "@/lib/api/errors";
import type { RouteContext } from "@/types/next";

interface OrderUserParams {
  id_user: string;
}

export async function GET(_request: Request, context: RouteContext<OrderUserParams>) {
  try {
    const { id_user } = await context.params;
    const orders = await listOrdersByUser(id_user);
    return NextResponse.json(orders);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener las ordenes del usuario");
  }
}

export async function POST(request: Request, context: RouteContext<OrderUserParams>) {
  try {
    const { id_user } = await context.params;
    const body = (await request.json()) as { items?: unknown };
    const result = await createOrder(id_user, body.items);

    return NextResponse.json(
      { message: `Orden creada con ID: ${result.id_orden}`, ...result },
      { status: 201 }
    );
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al crear la orden");
  }
}
