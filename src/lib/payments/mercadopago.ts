import { createHttpError } from "@/lib/api/errors";
import type { MercadoPagoPreferenceInput, MercadoPagoPreferenceResponse } from "@/types/domain";
import { isRecord } from "@/types/shared";

interface MercadoPagoPayload {
  items: Array<{
    title: string;
    quantity: number;
    currency_id: "ARS";
    unit_price: number;
  }>;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: "approved";
  notification_url?: string;
}

function ensureString(value: unknown, message: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw createHttpError(400, message);
  }

  return normalized;
}

function ensurePositiveNumber(value: unknown, message: string): number {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw createHttpError(400, message);
  }

  return parsed;
}

function resolveAppUrl(): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

  if (!baseUrl) {
    throw createHttpError(500, "Falta NEXT_PUBLIC_APP_URL para MercadoPago.");
  }

  return baseUrl.replace(/\/$/, "");
}

function readMessage(data: unknown): string | null {
  if (!isRecord(data)) {
    return null;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  return null;
}

export async function createMercadoPagoPreference(
  input: MercadoPagoPreferenceInput
): Promise<MercadoPagoPreferenceResponse> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw createHttpError(500, "Falta MERCADOPAGO_ACCESS_TOKEN.");
  }

  const title = ensureString(input.title, "El titulo del item es requerido.");
  const quantity = ensurePositiveNumber(
    input.quantity,
    "La cantidad debe ser mayor a 0."
  );
  const unitPrice = ensurePositiveNumber(
    input.price,
    "El precio debe ser mayor a 0."
  );

  const appUrl = resolveAppUrl();
  const payload: MercadoPagoPayload = {
    items: [
      {
        title,
        quantity,
        currency_id: "ARS",
        unit_price: unitPrice,
      },
    ],
    back_urls: {
      success: `${appUrl}/checkout/exito`,
      failure: `${appUrl}/checkout/rechazado`,
      pending: `${appUrl}/checkout/pendiente`,
    },
  };

  if (!/localhost|127\.0\.0\.1/i.test(appUrl)) {
    payload.auto_return = "approved";
  }

  if (process.env.MERCADOPAGO_WEBHOOK_URL) {
    payload.notification_url = process.env.MERCADOPAGO_WEBHOOK_URL.trim();
  }

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await response.json()) as unknown;

  if (!response.ok) {
    const message =
      readMessage(data) ||
      "MercadoPago rechazo la creacion de la preferencia.";

    throw createHttpError(response.status === 400 ? 400 : 502, message);
  }

  if (!isRecord(data)) {
    throw createHttpError(502, "MercadoPago devolvio una respuesta invalida.");
  }

  return {
    id: typeof data.id === "string" ? data.id : "",
    initPoint:
      typeof data.init_point === "string"
        ? data.init_point
        : typeof data.sandbox_init_point === "string"
          ? data.sandbox_init_point
          : "",
    raw: data,
  };
}
