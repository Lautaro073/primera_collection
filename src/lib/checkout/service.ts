import { createHttpError } from "@/lib/api/errors";
import { assertCartAccess, getCartItems } from "@/lib/cart/service";
import {
  getCustomerAddressById,
  listCustomerAddresses,
} from "@/lib/customer/address-service";
import { getCustomerProfileByUid } from "@/lib/customer/service";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { isShippingQuotesEnabled } from "@/lib/commerce-mode";
import { buildShippingState, selectShippingQuote } from "@/lib/shipping/service";
import type {
  CheckoutFulfillmentType,
  CheckoutSessionItem,
  CheckoutSessionPricing,
  CheckoutSessionSummary,
  CheckoutSessionShipping,
  CustomerAddress,
  FirebaseDateLike,
  SerializedCartItem,
} from "@/types/domain";
import { isRecord } from "@/types/shared";

interface CheckoutSessionPayload {
  addressId?: unknown;
  cartId?: unknown;
  fulfillmentType?: unknown;
  postalCode?: unknown;
}

interface CheckoutSessionRecord {
  addressId: string | null;
  addressSnapshot: CustomerAddress | null;
  cartId: string;
  createdAt?: FirebaseDateLike;
  customerUid: string;
  expiresAt?: FirebaseDateLike;
  items: CheckoutSessionItem[];
  orderId?: string | null;
  pricing: CheckoutSessionPricing;
  shipping: CheckoutSessionShipping;
  status: "open" | "expired" | "converted";
  updatedAt?: FirebaseDateLike;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readDateField(record: Record<string, unknown>, field: string): FirebaseDateLike {
  const value = record[field];

  if (
    value instanceof Date ||
    typeof value === "string" ||
    (isRecord(value) && "toDate" in value)
  ) {
    return value as FirebaseDateLike;
  }

  return undefined;
}

function toIsoString(value: FirebaseDateLike): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeCheckoutPayload(payload: CheckoutSessionPayload): {
  addressId: string | null;
  cartId: string;
  fulfillmentType: CheckoutFulfillmentType;
  postalCode: string | null;
} {
  const cartId = safeString(payload.cartId);

  if (!cartId) {
    throw createHttpError(400, "El carrito es requerido para iniciar checkout.");
  }

  return {
    addressId: safeString(payload.addressId) || null,
    cartId,
    fulfillmentType: payload.fulfillmentType === "pickup" ? "pickup" : "shipping",
    postalCode: safeString(payload.postalCode) || null,
  };
}

function serializeCheckoutItems(items: SerializedCartItem[]): CheckoutSessionItem[] {
  return items.map((item) => ({
    clave: item.clave,
    cantidad: item.cantidad,
    id_producto: item.id_producto,
    imagen: item.imagen,
    medida_seleccionada: item.medida_seleccionada,
    nombre: item.nombre,
    precio: item.precio,
    precio_lista: item.precio_lista,
    subtotal: item.precio * item.cantidad,
    subtotal_lista: item.precio_lista * item.cantidad,
    tiene_promocion: item.tiene_promocion,
  }));
}

function buildPricing(items: CheckoutSessionItem[]): CheckoutSessionPricing {
  const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
  const subtotalLista = items.reduce((total, item) => total + item.subtotal_lista, 0);

  return {
    subtotal,
    subtotal_lista: subtotalLista,
    descuentos_total: Math.max(0, subtotalLista - subtotal),
    shipping_total: null,
    total: subtotal,
  };
}

function withShippingPricing(
  pricing: CheckoutSessionPricing,
  shipping: CheckoutSessionShipping
): CheckoutSessionPricing {
  const shippingTotal = shipping.selected_quote?.amount ?? null;

  return {
    ...pricing,
    shipping_total: shippingTotal,
    total: shippingTotal !== null ? pricing.subtotal + shippingTotal : pricing.subtotal,
  };
}

async function resolveShippingState(
  items: CheckoutSessionItem[],
  address: CustomerAddress | null,
  postalCode: string | null,
  fulfillmentType: CheckoutFulfillmentType
): Promise<CheckoutSessionShipping> {
  if (!isShippingQuotesEnabled()) {
    return {
      destination_postal_code: null,
      fulfillment_type: fulfillmentType,
      pickup_label:
        fulfillmentType === "pickup"
          ? process.env.NEXT_PUBLIC_STORE_PICKUP_LABEL?.trim() || "Retiro en el local"
          : null,
      quotes: [],
      request: null,
      requires_address: fulfillmentType === "shipping",
      selected_quote: null,
      selected_quote_id: null,
      status: fulfillmentType === "pickup" ? "selected" : "pending",
    };
  }

  const targetPostalCode = address?.postal_code || postalCode || null;

  return buildShippingState(items, targetPostalCode, fulfillmentType);
}

async function resolveCheckoutAddress(
  customerUid: string,
  addressId: string | null
): Promise<CustomerAddress | null> {
  const customer = await getCustomerProfileByUid(customerUid);

  if (!customer) {
    throw createHttpError(404, "Perfil de cliente no encontrado.");
  }

  const targetAddressId = addressId || customer.default_address_id || null;

  if (!targetAddressId) {
    const addresses = await listCustomerAddresses(customerUid);
    return addresses[0] || null;
  }

  const address = await getCustomerAddressById(customerUid, targetAddressId);

  if (!address) {
    throw createHttpError(404, "Direccion no encontrada para este cliente.");
  }

  return address;
}

function serializeCheckoutSession(
  id: string,
  record: CheckoutSessionRecord
): CheckoutSessionSummary {
  return {
    id_checkout_session: id,
    cart_id: record.cartId,
    address_id: record.addressId,
    customer_uid: record.customerUid,
    order_id: record.orderId || null,
    status: record.status,
    items: record.items,
    pricing: record.pricing,
    shipping: record.shipping,
    address: record.addressSnapshot,
    expires_at: toIsoString(record.expiresAt),
    updated_at: toIsoString(record.updatedAt),
  };
}

function readCheckoutSessionRecord(data: Record<string, unknown>): CheckoutSessionRecord {
  const rawShipping = isRecord(data.shipping) ? data.shipping : {};

  return {
    addressId: safeString(data.addressId) || null,
    addressSnapshot: (data.addressSnapshot as CustomerAddress | null) || null,
    cartId: safeString(data.cartId),
    createdAt: readDateField(data, "createdAt"),
    customerUid: safeString(data.customerUid),
    expiresAt: readDateField(data, "expiresAt"),
    items: Array.isArray(data.items) ? (data.items as CheckoutSessionItem[]) : [],
    orderId: safeString(data.orderId) || null,
    pricing: data.pricing as CheckoutSessionPricing,
    shipping: {
      destination_postal_code:
        typeof rawShipping.destination_postal_code === "string"
          ? rawShipping.destination_postal_code
          : null,
      fulfillment_type: rawShipping.fulfillment_type === "pickup" ? "pickup" : "shipping",
      pickup_label:
        typeof rawShipping.pickup_label === "string" ? rawShipping.pickup_label : null,
      quotes: Array.isArray(rawShipping.quotes) ? (rawShipping.quotes as CheckoutSessionShipping["quotes"]) : [],
      request: isRecord(rawShipping.request)
        ? (rawShipping.request as unknown as CheckoutSessionShipping["request"])
        : null,
      requires_address: rawShipping.requires_address !== false,
      selected_quote: isRecord(rawShipping.selected_quote)
        ? (rawShipping.selected_quote as unknown as CheckoutSessionShipping["selected_quote"])
        : null,
      selected_quote_id:
        typeof rawShipping.selected_quote_id === "string" ? rawShipping.selected_quote_id : null,
      status:
        rawShipping.status === "quoted" ||
        rawShipping.status === "selected" ||
        rawShipping.status === "unavailable"
          ? rawShipping.status
          : "pending",
    },
    status:
      data.status === "expired" || data.status === "converted" ? data.status : "open",
    updatedAt: readDateField(data, "updatedAt"),
  };
}

export async function getCheckoutSessionById(
  customerUid: string,
  sessionId: string
): Promise<CheckoutSessionSummary> {
  const normalizedSessionId = safeString(sessionId);
  const normalizedCustomerUid = safeString(customerUid);

  if (!normalizedSessionId || !normalizedCustomerUid) {
    throw createHttpError(400, "La sesion de checkout es requerida.");
  }

  const db = getFirebaseAdminDb();
  const sessionDoc = await db.collection("checkout_sessions").doc(normalizedSessionId).get();

  if (!sessionDoc.exists) {
    throw createHttpError(404, "Sesion de checkout no encontrada.");
  }

  const record = readCheckoutSessionRecord(sessionDoc.data() ?? {});

  if (record.customerUid !== normalizedCustomerUid) {
    throw createHttpError(404, "Sesion de checkout no encontrada.");
  }

  return serializeCheckoutSession(sessionDoc.id, record);
}

export async function createCheckoutSession(
  customerUid: string,
  payload: CheckoutSessionPayload
): Promise<CheckoutSessionSummary> {
  const normalizedCustomerUid = safeString(customerUid);

  if (!normalizedCustomerUid) {
    throw createHttpError(400, "El cliente es requerido para iniciar checkout.");
  }

  const { addressId, cartId, fulfillmentType, postalCode } = normalizeCheckoutPayload(payload);
  await assertCartAccess(cartId, normalizedCustomerUid);
  const cartItems = await getCartItems(cartId, normalizedCustomerUid);

  if (cartItems.length === 0) {
    throw createHttpError(400, "El carrito esta vacio.");
  }

  const [address, db] = await Promise.all([
    fulfillmentType === "pickup"
      ? Promise.resolve(null)
      : resolveCheckoutAddress(normalizedCustomerUid, addressId),
    Promise.resolve(getFirebaseAdminDb()),
  ]);
  const items = serializeCheckoutItems(cartItems);
  const shipping = await resolveShippingState(items, address, postalCode, fulfillmentType);
  const pricing = withShippingPricing(buildPricing(items), shipping);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 30);
  const ref = await db.collection("checkout_sessions").add({
    addressId: address?.id || null,
    addressSnapshot: address,
    cartId,
    createdAt: now,
    customerUid: normalizedCustomerUid,
    expiresAt,
    items,
    orderId: null,
    pricing,
    shipping,
    status: "open",
    updatedAt: now,
  } satisfies CheckoutSessionRecord);

  return serializeCheckoutSession(ref.id, {
    addressId: address?.id || null,
    addressSnapshot: address,
    cartId,
    createdAt: now,
    customerUid: normalizedCustomerUid,
    expiresAt,
    items,
    orderId: null,
    pricing,
    shipping,
    status: "open",
    updatedAt: now,
  });
}

export async function refreshCheckoutSession(
  customerUid: string,
  sessionId: string,
  payload: CheckoutSessionPayload
): Promise<CheckoutSessionSummary> {
  const normalizedSessionId = safeString(sessionId);

  if (!normalizedSessionId) {
    throw createHttpError(400, "La sesion de checkout es requerida.");
  }

  const normalizedCustomerUid = safeString(customerUid);
  const { addressId, cartId, fulfillmentType, postalCode } = normalizeCheckoutPayload(payload);
  const db = getFirebaseAdminDb();
  const sessionRef = db.collection("checkout_sessions").doc(normalizedSessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    throw createHttpError(404, "Sesion de checkout no encontrada.");
  }

  const currentSession = readCheckoutSessionRecord(sessionDoc.data() ?? {});

  if (currentSession.customerUid !== normalizedCustomerUid) {
    throw createHttpError(404, "Sesion de checkout no encontrada.");
  }

  await assertCartAccess(cartId, normalizedCustomerUid);
  const cartItems = await getCartItems(cartId, normalizedCustomerUid);

  if (cartItems.length === 0) {
    throw createHttpError(400, "El carrito esta vacio.");
  }

  const address =
    fulfillmentType === "pickup"
      ? null
      : await resolveCheckoutAddress(normalizedCustomerUid, addressId);
  const items = serializeCheckoutItems(cartItems);
  const shipping = await resolveShippingState(items, address, postalCode, fulfillmentType);
  const pricing = withShippingPricing(buildPricing(items), shipping);
  const updatedAt = new Date();

  const nextRecord: CheckoutSessionRecord = {
    ...currentSession,
    addressId: address?.id || null,
    addressSnapshot: address,
    cartId,
    customerUid: normalizedCustomerUid,
    items,
    orderId: currentSession.orderId || null,
    pricing,
    shipping,
    status: "open",
    updatedAt,
  };

  await sessionRef.set(nextRecord, { merge: true });

  return serializeCheckoutSession(normalizedSessionId, nextRecord);
}

export async function selectCheckoutSessionShippingQuote(
  customerUid: string,
  sessionId: string,
  quoteId: string
): Promise<CheckoutSessionSummary> {
  const normalizedCustomerUid = safeString(customerUid);
  const normalizedSessionId = safeString(sessionId);
  const normalizedQuoteId = safeString(quoteId);

  if (!normalizedSessionId || !normalizedQuoteId) {
    throw createHttpError(400, "La sesion y la cotizacion son requeridas.");
  }

  const db = getFirebaseAdminDb();
  const sessionRef = db.collection("checkout_sessions").doc(normalizedSessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    throw createHttpError(404, "Sesion de checkout no encontrada.");
  }

  const currentSession = readCheckoutSessionRecord(sessionDoc.data() ?? {});

  if (currentSession.customerUid !== normalizedCustomerUid) {
    throw createHttpError(404, "Sesion de checkout no encontrada.");
  }

  const nextShipping = selectShippingQuote(currentSession.shipping, normalizedQuoteId);

  if (!nextShipping.selected_quote) {
    throw createHttpError(404, "Cotizacion de envio no encontrada.");
  }

  const nextRecord: CheckoutSessionRecord = {
    ...currentSession,
    shipping: nextShipping,
    pricing: withShippingPricing(currentSession.pricing, nextShipping),
    updatedAt: new Date(),
  };

  await sessionRef.set(nextRecord, { merge: true });

  return serializeCheckoutSession(normalizedSessionId, nextRecord);
}
