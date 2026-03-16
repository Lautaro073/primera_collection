import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import { requireCustomer } from "@/lib/auth/customer";
import { updateCustomerProfile } from "@/lib/customer/service";

export async function PATCH(request: Request) {
  try {
    ensureCommerceFeatureEnabled("userAccounts", "Las cuentas de usuario no estan habilitadas en modo catalogo.");
    const customer = await requireCustomer(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const profile = await updateCustomerProfile(customer.uid, payload);

    return NextResponse.json(profile);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al actualizar el perfil del cliente");
  }
}
