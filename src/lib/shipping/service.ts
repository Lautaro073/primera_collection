import type {
  CheckoutFulfillmentType,
  CheckoutSessionShipping,
  CheckoutSessionShippingRequest,
  ShippingQuote,
} from "@/types/domain";
import { getMiCorreoRates, hasMiCorreoCredentials } from "@/lib/shipping/micorreo";

interface ShippingQuoteItem {
  cantidad: number;
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractPostalDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function getZoneMultiplier(originPostalCode: string, destinationPostalCode: string): number {
  const originDigits = extractPostalDigits(originPostalCode);
  const destinationDigits = extractPostalDigits(destinationPostalCode);

  if (!originDigits || !destinationDigits) {
    return 1.2;
  }

  if (originDigits.slice(0, 2) === destinationDigits.slice(0, 2)) {
    return 1;
  }

  if (originDigits[0] === destinationDigits[0]) {
    return 1.15;
  }

  return 1.35;
}

function getPackageRequest(
  items: ShippingQuoteItem[],
  destinationPostalCode: string,
): CheckoutSessionShippingRequest {
  const quantity = items.reduce((total, item) => total + item.cantidad, 0);
  const weightPerItem = parseNumber(process.env.SHIPPING_DEFAULT_ITEM_WEIGHT_GRAMS, 550);

  return {
    destination_postal_code: destinationPostalCode,
    origin_postal_code: process.env.SHIPPING_ORIGIN_POSTAL_CODE?.trim() || "4000",
    package_height_cm: parseNumber(process.env.SHIPPING_DEFAULT_HEIGHT_CM, 12),
    package_length_cm: parseNumber(process.env.SHIPPING_DEFAULT_LENGTH_CM, 35),
    package_weight_grams: Math.max(weightPerItem, quantity * weightPerItem),
    package_width_cm: parseNumber(process.env.SHIPPING_DEFAULT_WIDTH_CM, 28),
  };
}

function buildEstimatedQuote(
  request: CheckoutSessionShippingRequest,
  {
    amount,
    deliveryType,
    etaMaxDays,
    etaMinDays,
    quoteId,
    serviceCode,
    serviceName,
  }: {
    amount: number;
    deliveryType: "domicilio" | "sucursal";
    etaMaxDays: number;
    etaMinDays: number;
    quoteId: string;
    serviceCode: string;
    serviceName: string;
  },
): ShippingQuote {
  const zoneMultiplier = getZoneMultiplier(
    request.origin_postal_code,
    request.destination_postal_code,
  );
  const weightedAmount = Math.round(amount * zoneMultiplier);

  return {
    id: quoteId,
    amount: weightedAmount,
    currency: "ARS",
    delivery_type: deliveryType,
    eta_max_days: etaMaxDays,
    eta_min_days: etaMinDays,
    kind: "estimado",
    provider: "correo_argentino",
    service_code: serviceCode,
    service_name: serviceName,
  };
}

function buildPickupState(): CheckoutSessionShipping {
  return {
    destination_postal_code: null,
    fulfillment_type: "pickup",
    pickup_label: process.env.NEXT_PUBLIC_STORE_PICKUP_LABEL?.trim() || "Retiro en el local",
    quotes: [],
    request: null,
    requires_address: false,
    selected_quote: null,
    selected_quote_id: null,
    status: "selected",
  };
}

function buildEstimatedShippingState(
  request: CheckoutSessionShippingRequest,
): CheckoutSessionShipping {
  const domicilioBase = parseNumber(process.env.SHIPPING_FALLBACK_DOMICILIO_PRICE, 6500);
  const sucursalBase = parseNumber(process.env.SHIPPING_FALLBACK_SUCURSAL_PRICE, 5200);
  const quotes = [
    buildEstimatedQuote(request, {
      amount: domicilioBase,
      deliveryType: "domicilio",
      etaMaxDays: 5,
      etaMinDays: 2,
      quoteId: "correo-argentino-domicilio-est",
      serviceCode: "ca_home_est",
      serviceName: "Envio a domicilio",
    }),
    buildEstimatedQuote(request, {
      amount: sucursalBase,
      deliveryType: "sucursal",
      etaMaxDays: 6,
      etaMinDays: 3,
      quoteId: "correo-argentino-sucursal-est",
      serviceCode: "ca_branch_est",
      serviceName: "Retiro en sucursal",
    }),
  ];

  return {
    destination_postal_code: request.destination_postal_code,
    fulfillment_type: "shipping",
    pickup_label: null,
    quotes,
    request,
    requires_address: true,
    selected_quote: null,
    selected_quote_id: null,
    status: quotes.length > 0 ? "quoted" : "unavailable",
  };
}

export async function buildShippingState(
  items: ShippingQuoteItem[],
  destinationPostalCode: string | null,
  fulfillmentType: CheckoutFulfillmentType = "shipping",
): Promise<CheckoutSessionShipping> {
  if (fulfillmentType === "pickup") {
    return buildPickupState();
  }

  const normalizedPostalCode = destinationPostalCode?.trim() || "";

  if (!normalizedPostalCode) {
    return {
      destination_postal_code: null,
      fulfillment_type: "shipping",
      pickup_label: null,
      quotes: [],
      request: null,
      requires_address: true,
      selected_quote: null,
      selected_quote_id: null,
      status: "pending",
    };
  }

  const request = getPackageRequest(items, normalizedPostalCode);

  if (!hasMiCorreoCredentials()) {
    return buildEstimatedShippingState(request);
  }

  try {
    const quotes = await getMiCorreoRates({
      postalCodeOrigin: request.origin_postal_code,
      postalCodeDestination: request.destination_postal_code,
      dimensions: {
        weight: request.package_weight_grams,
        height: request.package_height_cm,
        width: request.package_width_cm,
        length: request.package_length_cm,
      },
    });

    return {
      destination_postal_code: normalizedPostalCode,
      fulfillment_type: "shipping",
      pickup_label: null,
      quotes,
      request,
      requires_address: true,
      selected_quote: null,
      selected_quote_id: null,
      status: quotes.length > 0 ? "quoted" : "unavailable",
    };
  } catch {
    return buildEstimatedShippingState(request);
  }
}

export function selectShippingQuote(
  shipping: CheckoutSessionShipping,
  quoteId: string,
): CheckoutSessionShipping {
  const normalizedQuoteId = quoteId.trim();
  const selectedQuote = shipping.quotes.find((quote) => quote.id === normalizedQuoteId) || null;

  return {
    ...shipping,
    selected_quote: selectedQuote,
    selected_quote_id: selectedQuote?.id || null,
    status: selectedQuote ? "selected" : shipping.status,
  };
}
