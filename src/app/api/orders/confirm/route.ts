import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/customer";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import { createOrderFromCheckoutSession } from "@/lib/orders/service";

export async function POST(request: Request) {
  try {
    ensureCommerceFeatureEnabled("checkout", "El checkout no esta habilitado en modo catalogo.");
    const customer = await requireCustomer(request);
    const payload = (await request.json()) as { checkout_session_id?: unknown };
    const checkoutSessionId =
      typeof payload.checkout_session_id === "string" ? payload.checkout_session_id : "";
    const order = await createOrderFromCheckoutSession(customer.uid, checkoutSessionId);

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al confirmar el pedido");
  }
}
