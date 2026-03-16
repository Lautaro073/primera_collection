import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import { requireCustomer } from "@/lib/auth/customer";
import { ensureCustomerProfile } from "@/lib/customer/service";

export async function GET(request: Request) {
  try {
    ensureCommerceFeatureEnabled("userAccounts", "Las cuentas de usuario no estan habilitadas en modo catalogo.");
    const customer = await requireCustomer(request);
    const profile = await ensureCustomerProfile(customer.uid, {
      email: customer.email ?? null,
    });

    return NextResponse.json(profile);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener el perfil del cliente");
  }
}
