import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { getOptionalCustomer } from "@/lib/auth/customer";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import { getCartItems } from "@/lib/cart/service";
import { buildShippingState } from "@/lib/shipping/service";

interface ShippingEstimatePayload {
  cart_id?: unknown;
  postal_code?: unknown;
}

export async function POST(request: Request) {
  try {
    ensureCommerceFeatureEnabled(
      "shippingQuotes",
      "Las cotizaciones de envio no estan habilitadas.",
    );

    const payload = (await request.json()) as ShippingEstimatePayload;
    const cartId = typeof payload.cart_id === "string" ? payload.cart_id.trim() : "";
    const postalCode = typeof payload.postal_code === "string" ? payload.postal_code.trim() : "";

    if (!cartId) {
      return NextResponse.json({ error: "El carrito es requerido." }, { status: 400 });
    }

    if (postalCode.length < 4) {
      return NextResponse.json(
        { error: "El codigo postal debe tener al menos 4 caracteres." },
        { status: 400 },
      );
    }

    const customer = await getOptionalCustomer(request);
    const items = await getCartItems(cartId, customer?.uid || null);

    if (items.length === 0) {
      return NextResponse.json({ error: "El carrito esta vacio." }, { status: 400 });
    }

    const shipping = await buildShippingState(
      items.map((item) => ({ cantidad: item.cantidad })),
      postalCode,
      "shipping",
    );

    return NextResponse.json({
      postal_code: postalCode,
      quotes: shipping.quotes,
    });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al calcular el envio");
  }
}
