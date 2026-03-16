import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/customer";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import { setDefaultCustomerAddress } from "@/lib/customer/address-service";
import type { RouteContext } from "@/types/next";

interface CustomerAddressDefaultParams {
  addressId: string;
}

export async function PUT(
  request: Request,
  context: RouteContext<CustomerAddressDefaultParams>
) {
  try {
    ensureCommerceFeatureEnabled("userAccounts", "Las cuentas de usuario no estan habilitadas en modo catalogo.");
    const customer = await requireCustomer(request);
    const { addressId } = await context.params;
    const address = await setDefaultCustomerAddress(customer.uid, addressId);
    return NextResponse.json(address);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al actualizar la direccion predeterminada");
  }
}
