import type { DocumentData } from "firebase-admin/firestore";
import { createHttpError } from "@/lib/api/errors";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import type {
  CustomerProfile,
  CustomerProfileInput,
  FirebaseDateLike,
  RawCustomerRecord,
} from "@/types/domain";
import { isRecord } from "@/types/shared";

interface CustomerProfileInputPayload {
  email?: unknown;
  firstName?: unknown;
  first_name?: unknown;
  lastName?: unknown;
  last_name?: unknown;
  phone?: unknown;
  dni?: unknown;
  activeCartId?: unknown;
  defaultAddressId?: unknown;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readDateField(data: DocumentData, field: string): FirebaseDateLike {
  const value = data[field];

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

function toRawCustomerRecord(uid: string, data: DocumentData): RawCustomerRecord {
  return {
    uid,
    email: safeString(data.email) || null,
    firstName: safeString(data.firstName),
    lastName: safeString(data.lastName),
    phone: safeString(data.phone),
    dni: safeString(data.dni),
    activeCartId: safeString(data.activeCartId) || null,
    defaultAddressId: safeString(data.defaultAddressId) || null,
    createdAt: readDateField(data, "createdAt"),
    updatedAt: readDateField(data, "updatedAt"),
    lastLoginAt: readDateField(data, "lastLoginAt"),
  };
}

function serializeCustomerProfile(customer: RawCustomerRecord): CustomerProfile {
  return {
    uid: customer.uid,
    email: customer.email,
    first_name: customer.firstName,
    last_name: customer.lastName,
    phone: customer.phone,
    dni: customer.dni,
    active_cart_id: customer.activeCartId || null,
    default_address_id: customer.defaultAddressId || null,
    created_at: toIsoString(customer.createdAt),
    updated_at: toIsoString(customer.updatedAt),
    last_login_at: toIsoString(customer.lastLoginAt),
  };
}

function normalizeCustomerProfileInput(
  input: CustomerProfileInputPayload,
  { partial = false }: { partial?: boolean } = {}
): CustomerProfileInput {
  const hasEmail = input.email !== undefined;
  const hasFirstName = input.firstName !== undefined || input.first_name !== undefined;
  const hasLastName = input.lastName !== undefined || input.last_name !== undefined;
  const hasPhone = input.phone !== undefined;
  const hasDni = input.dni !== undefined;
  const hasActiveCartId = "activeCartId" in input;
  const hasDefaultAddressId = "defaultAddressId" in input;
  const normalized: CustomerProfileInput = {};

  if (!partial || hasEmail) {
    const email = safeString(input.email);
    normalized.email = email || null;
  }

  if (!partial || hasFirstName) {
    normalized.firstName = safeString(input.firstName ?? input.first_name);
  }

  if (!partial || hasLastName) {
    normalized.lastName = safeString(input.lastName ?? input.last_name);
  }

  if (!partial || hasPhone) {
    normalized.phone = safeString(input.phone);
  }

  if (!partial || hasDni) {
    normalized.dni = safeString(input.dni);
  }

  if (!partial || hasActiveCartId) {
    normalized.activeCartId = safeString(input.activeCartId) || null;
  }

  if (!partial || hasDefaultAddressId) {
    normalized.defaultAddressId = safeString(input.defaultAddressId) || null;
  }

  if (partial && Object.keys(normalized).length === 0) {
    throw createHttpError(400, "No se enviaron datos para actualizar el perfil.");
  }

  return normalized;
}

export async function getCustomerProfileByUid(uid: string): Promise<CustomerProfile | null> {
  const normalizedUid = safeString(uid);

  if (!normalizedUid) {
    throw createHttpError(400, "El uid del cliente es requerido.");
  }

  const db = getFirebaseAdminDb();
  const document = await db.collection("customers").doc(normalizedUid).get();

  if (!document.exists) {
    return null;
  }

  return serializeCustomerProfile(toRawCustomerRecord(document.id, document.data() ?? {}));
}

export async function ensureCustomerProfile(
  uid: string,
  input: CustomerProfileInputPayload = {}
): Promise<CustomerProfile> {
  const normalizedUid = safeString(uid);

  if (!normalizedUid) {
    throw createHttpError(400, "El uid del cliente es requerido.");
  }

  const db = getFirebaseAdminDb();
  const now = new Date();
  const existing = await getCustomerProfileByUid(normalizedUid);
  const normalized = normalizeCustomerProfileInput(input, { partial: true });
  const payload = {
    email: normalized.email ?? existing?.email ?? null,
    firstName: normalized.firstName ?? existing?.first_name ?? "",
    lastName: normalized.lastName ?? existing?.last_name ?? "",
    phone: normalized.phone ?? existing?.phone ?? "",
    dni: normalized.dni ?? existing?.dni ?? "",
    activeCartId: normalized.activeCartId ?? existing?.active_cart_id ?? null,
    defaultAddressId: normalized.defaultAddressId ?? existing?.default_address_id ?? null,
    updatedAt: now,
    lastLoginAt: now,
    ...(!existing ? { createdAt: now } : {}),
  };

  await db.collection("customers").doc(normalizedUid).set(payload, { merge: true });

  const profile = await getCustomerProfileByUid(normalizedUid);

  if (!profile) {
    throw createHttpError(500, "No se pudo inicializar el perfil del cliente.");
  }

  return profile;
}

export async function registerCustomerProfile(
  uid: string,
  input: CustomerProfileInputPayload
): Promise<CustomerProfile> {
  const normalized = normalizeCustomerProfileInput(input);

  if (!normalized.firstName) {
    throw createHttpError(400, "El nombre es requerido.");
  }

  if (!normalized.lastName) {
    throw createHttpError(400, "El apellido es requerido.");
  }

  return ensureCustomerProfile(uid, normalized);
}

export async function updateCustomerProfile(
  uid: string,
  input: CustomerProfileInputPayload
): Promise<CustomerProfile> {
  const normalizedUid = safeString(uid);

  if (!normalizedUid) {
    throw createHttpError(400, "El uid del cliente es requerido.");
  }

  const db = getFirebaseAdminDb();
  const existing = await getCustomerProfileByUid(normalizedUid);

  if (!existing) {
    throw createHttpError(404, "Perfil de cliente no encontrado.");
  }

  const normalized = normalizeCustomerProfileInput(input, { partial: true });

  await db.collection("customers").doc(normalizedUid).set(
    {
      ...(normalized.email !== undefined ? { email: normalized.email } : {}),
      ...(normalized.firstName !== undefined ? { firstName: normalized.firstName } : {}),
      ...(normalized.lastName !== undefined ? { lastName: normalized.lastName } : {}),
      ...(normalized.phone !== undefined ? { phone: normalized.phone } : {}),
      ...(normalized.dni !== undefined ? { dni: normalized.dni } : {}),
      ...(normalized.activeCartId !== undefined
        ? { activeCartId: normalized.activeCartId }
        : {}),
      ...(normalized.defaultAddressId !== undefined
        ? { defaultAddressId: normalized.defaultAddressId }
        : {}),
      updatedAt: new Date(),
    },
    { merge: true }
  );

  const updatedProfile = await getCustomerProfileByUid(normalizedUid);

  if (!updatedProfile) {
    throw createHttpError(500, "No se pudo actualizar el perfil del cliente.");
  }

  return updatedProfile;
}

export async function setCustomerActiveCartId(
  uid: string,
  activeCartId: string | null
): Promise<void> {
  await updateCustomerProfile(uid, { activeCartId });
}

export async function setCustomerDefaultAddressId(
  uid: string,
  defaultAddressId: string | null
): Promise<void> {
  await updateCustomerProfile(uid, { defaultAddressId });
}
