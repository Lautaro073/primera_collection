import { createHttpError } from "@/lib/api/errors";
import type { ShippingQuote } from "@/types/domain";

interface MiCorreoRatesRequest {
  dimensions: {
    height: number;
    length: number;
    weight: number;
    width: number;
  };
  postalCodeDestination: string;
  postalCodeOrigin: string;
}

interface MiCorreoRatesResponse {
  customerId?: string;
  rates?: Array<{
    deliveredType?: "D" | "S";
    deliveryTimeMax?: string | number;
    deliveryTimeMin?: string | number;
    price?: number | string;
    productName?: string;
    productType?: string;
  }>;
  validTo?: string;
}

interface TokenCache {
  expiresAt: number;
  token: string;
}

const DEFAULT_MICORREO_BASE_URL = "https://api.correoargentino.com.ar/micorreo/v1";
let tokenCache: TokenCache | null = null;

function safeString(value: string | undefined): string {
  return value?.trim() || "";
}

function parseNumber(value: number | string | undefined | null): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getMiCorreoBaseUrl(): string {
  return safeString(process.env.MICORREO_BASE_URL) || DEFAULT_MICORREO_BASE_URL;
}

function getMiCorreoTimeoutMs(): number {
  const parsed = Number(process.env.MICORREO_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8000;
}

function getMiCorreoTokenSkewMs(): number {
  const parsed = Number(process.env.MICORREO_TOKEN_SKEW_SECONDS);
  const seconds = Number.isFinite(parsed) && parsed >= 0 ? parsed : 60;
  return seconds * 1000;
}

function isMiCorreoConfigured(): boolean {
  return Boolean(
    safeString(process.env.MICORREO_USERNAME) &&
      safeString(process.env.MICORREO_PASSWORD) &&
      safeString(process.env.MICORREO_CUSTOMER_ID),
  );
}

function mapMiCorreoQuote(
  rate: NonNullable<MiCorreoRatesResponse["rates"]>[number],
): ShippingQuote | null {
  const amount = parseNumber(rate.price);

  if (!amount || !rate.deliveredType) {
    return null;
  }

  return {
    id: `micorreo-${rate.deliveredType}-${safeString(rate.productType) || "std"}`,
    amount,
    currency: "ARS",
    delivery_type: rate.deliveredType === "S" ? "sucursal" : "domicilio",
    eta_max_days: parseNumber(rate.deliveryTimeMax),
    eta_min_days: parseNumber(rate.deliveryTimeMin),
    kind: "real",
    provider: "correo_argentino",
    service_code: safeString(rate.productType) || "CA",
    service_name: safeString(rate.productName) || "Correo Argentino",
  };
}

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

async function getMiCorreoToken(): Promise<string> {
  const now = Date.now();

  if (tokenCache && tokenCache.expiresAt > now + getMiCorreoTokenSkewMs()) {
    return tokenCache.token;
  }

  const username = safeString(process.env.MICORREO_USERNAME);
  const password = safeString(process.env.MICORREO_PASSWORD);

  if (!username || !password) {
    throw createHttpError(500, "Faltan credenciales de Correo Argentino.");
  }

  const response = await fetch(`${getMiCorreoBaseUrl()}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    },
    cache: "no-store",
    signal: createTimeoutSignal(getMiCorreoTimeoutMs()),
  });

  if (!response.ok) {
    throw createHttpError(response.status, "No se pudo autenticar con Correo Argentino.");
  }

  const payload = (await response.json()) as { expires?: string; token?: string };
  const token = safeString(payload.token);

  if (!token) {
    throw createHttpError(502, "Correo Argentino no devolvio un token valido.");
  }

  const expiresAt = payload.expires ? new Date(payload.expires).getTime() : now + 15 * 60 * 1000;
  tokenCache = {
    token,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : now + 15 * 60 * 1000,
  };

  return token;
}

async function requestMiCorreoRates(
  token: string,
  request: MiCorreoRatesRequest,
): Promise<Response> {
  const customerId = safeString(process.env.MICORREO_CUSTOMER_ID);

  return fetch(`${getMiCorreoBaseUrl()}/rates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal: createTimeoutSignal(getMiCorreoTimeoutMs()),
    body: JSON.stringify({
      customerId,
      postalCodeOrigin: request.postalCodeOrigin,
      postalCodeDestination: request.postalCodeDestination,
      dimensions: {
        weight: request.dimensions.weight,
        height: request.dimensions.height,
        width: request.dimensions.width,
        length: request.dimensions.length,
      },
    }),
  });
}

export async function getMiCorreoRates(
  request: MiCorreoRatesRequest,
): Promise<ShippingQuote[]> {
  if (!isMiCorreoConfigured()) {
    throw createHttpError(500, "La integracion con Correo Argentino no esta configurada.");
  }

  let token = await getMiCorreoToken();
  let response = await requestMiCorreoRates(token, request);

  if (response.status === 401 || response.status === 403) {
    tokenCache = null;
    token = await getMiCorreoToken();
    response = await requestMiCorreoRates(token, request);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw createHttpError(
      response.status,
      payload?.message || "No se pudo cotizar con Correo Argentino.",
    );
  }

  const payload = (await response.json()) as MiCorreoRatesResponse;
  const quotes = Array.isArray(payload.rates)
    ? payload.rates
        .map((rate) => mapMiCorreoQuote(rate))
        .filter((quote): quote is ShippingQuote => quote !== null)
    : [];

  if (quotes.length === 0) {
    throw createHttpError(502, "Correo Argentino no devolvio tarifas validas.");
  }

  return quotes;
}

export function hasMiCorreoCredentials(): boolean {
  return isMiCorreoConfigured();
}
