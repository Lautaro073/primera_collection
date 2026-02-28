import { NextResponse } from "next/server";
import { createMercadoPagoPreference } from "@/lib/payments/mercadopago";
import { toErrorResponse } from "@/lib/api/errors";
import type { MercadoPagoPreferenceInput } from "@/types/domain";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MercadoPagoPreferenceInput;
    const preference = await createMercadoPagoPreference(body);

    return new NextResponse(preference.initPoint, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al crear la preferencia");
  }
}
