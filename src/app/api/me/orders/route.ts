import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/customer";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import { listOrdersByCustomer } from "@/lib/orders/service";

export async function GET(request: Request) {
  try {
    ensureCommerceFeatureEnabled("checkout", "Los pedidos no estan habilitados en modo catalogo.");
    const customer = await requireCustomer(request);
    const orders = await listOrdersByCustomer(customer.uid);
    return NextResponse.json(orders);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener los pedidos del cliente");
  }
}
