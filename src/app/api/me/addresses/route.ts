import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/customer";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import {
  createCustomerAddress,
  listCustomerAddresses,
} from "@/lib/customer/address-service";

export async function GET(request: Request) {
  try {
    ensureCommerceFeatureEnabled("userAccounts", "Las cuentas de usuario no estan habilitadas en modo catalogo.");
    const customer = await requireCustomer(request);
    const addresses = await listCustomerAddresses(customer.uid);
    return NextResponse.json(addresses);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener las direcciones del cliente");
  }
}

export async function POST(request: Request) {
  try {
    ensureCommerceFeatureEnabled("userAccounts", "Las cuentas de usuario no estan habilitadas en modo catalogo.");
    const customer = await requireCustomer(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const address = await createCustomerAddress(customer.uid, payload);
    return NextResponse.json(address, { status: 201 });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al crear la direccion del cliente");
  }
}
