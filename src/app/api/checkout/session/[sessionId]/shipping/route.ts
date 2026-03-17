import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/customer";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import { selectCheckoutSessionShippingQuote } from "@/lib/checkout/service";
import type { RouteContext } from "@/types/next";

interface CheckoutSessionShippingParams {
  sessionId: string;
}

export async function PUT(
  request: Request,
  context: RouteContext<CheckoutSessionShippingParams>
) {
  try {
    ensureCommerceFeatureEnabled("shippingQuotes", "Las cotizaciones de envio no estan habilitadas.");
    const customer = await requireCustomer(request);
    const { sessionId } = await context.params;
    const payload = (await request.json()) as { quote_id?: unknown };
    const quoteId = typeof payload.quote_id === "string" ? payload.quote_id : "";
    const session = await selectCheckoutSessionShippingQuote(customer.uid, sessionId, quoteId);

    return NextResponse.json(session);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al seleccionar la cotizacion de envio");
  }
}
