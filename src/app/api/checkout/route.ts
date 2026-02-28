import { NextResponse } from "next/server";
import { createCheckout } from "@/lib/orders/service";
import { toErrorResponse } from "@/lib/api/errors";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createCheckout(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al procesar el checkout");
  }
}
