import { NextResponse } from "next/server";
import { getOrderDetails } from "@/lib/orders/service";
import { toErrorResponse } from "@/lib/api/errors";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import type { RouteContext } from "@/types/next";

interface OrderDetailParams {
  id_orden: string;
}

export async function GET(_request: Request, context: RouteContext<OrderDetailParams>) {
  try {
    ensureCommerceFeatureEnabled("checkout", "Los detalles de orden no estan habilitados en modo catalogo.");
    const { id_orden } = await context.params;
    const details = await getOrderDetails(id_orden);
    return NextResponse.json(details);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener los detalles de la orden");
  }
}
