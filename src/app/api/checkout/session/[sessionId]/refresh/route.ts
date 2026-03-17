import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/customer";
import { refreshCheckoutSession } from "@/lib/checkout/service";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import type { RouteContext } from "@/types/next";

interface CheckoutSessionParams {
  sessionId: string;
}

export async function POST(
  request: Request,
  context: RouteContext<CheckoutSessionParams>
) {
  try {
    ensureCommerceFeatureEnabled("checkout", "El checkout no esta habilitado en modo catalogo.");
    const customer = await requireCustomer(request);
    const { sessionId } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const session = await refreshCheckoutSession(customer.uid, sessionId, {
      cartId: payload.cart_id,
      addressId: payload.address_id,
      fulfillmentType: payload.fulfillment_type,
      postalCode: payload.postal_code,
    });

    return NextResponse.json(session);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al actualizar la sesion de checkout");
  }
}
