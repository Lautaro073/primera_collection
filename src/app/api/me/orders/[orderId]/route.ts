import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/customer";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import { getOrderByIdForCustomer } from "@/lib/orders/service";
import type { RouteContext } from "@/types/next";

interface CustomerOrderParams {
  orderId: string;
}

export async function GET(
  request: Request,
  context: RouteContext<CustomerOrderParams>,
) {
  try {
    ensureCommerceFeatureEnabled("checkout", "Los pedidos no estan habilitados en modo catalogo.");
    const customer = await requireCustomer(request);
    const { orderId } = await context.params;
    const order = await getOrderByIdForCustomer(customer.uid, orderId);
    return NextResponse.json(order);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener el pedido");
  }
}
