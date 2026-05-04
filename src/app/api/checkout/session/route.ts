import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/customer";
import { createCheckoutSession } from "@/lib/checkout/service";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";

export async function POST(request: Request) {
  try {
    ensureCommerceFeatureEnabled("checkout", "El checkout no esta habilitado en modo catalogo.");
    const customer = await requireCustomer(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const session = await createCheckoutSession(customer.uid, {
      cartId: payload.cart_id,
      addressId: payload.address_id,
      fulfillmentType: payload.fulfillment_type,
      postalCode: payload.postal_code,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al iniciar la sesion de checkout");
  }
}
