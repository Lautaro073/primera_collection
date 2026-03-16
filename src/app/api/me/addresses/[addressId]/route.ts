import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/customer";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import {
  deleteCustomerAddress,
  updateCustomerAddress,
} from "@/lib/customer/address-service";
import type { RouteContext } from "@/types/next";

interface CustomerAddressParams {
  addressId: string;
}

export async function PATCH(
  request: Request,
  context: RouteContext<CustomerAddressParams>
) {
  try {
    ensureCommerceFeatureEnabled("userAccounts", "Las cuentas de usuario no estan habilitadas en modo catalogo.");
    const customer = await requireCustomer(request);
    const { addressId } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const address = await updateCustomerAddress(customer.uid, addressId, payload);
    return NextResponse.json(address);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al actualizar la direccion del cliente");
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext<CustomerAddressParams>
) {
  try {
    ensureCommerceFeatureEnabled("userAccounts", "Las cuentas de usuario no estan habilitadas en modo catalogo.");
    const customer = await requireCustomer(request);
    const { addressId } = await context.params;
    await deleteCustomerAddress(customer.uid, addressId);
    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al eliminar la direccion del cliente");
  }
}
