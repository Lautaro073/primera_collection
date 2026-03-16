import { createHttpError } from "@/lib/api/errors";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import type {
  CustomerAddress,
  CustomerAddressInput,
  CustomerAddressLabel,
  FirebaseDateLike,
  RawCustomerAddressRecord,
} from "@/types/domain";
import { isRecord } from "@/types/shared";

interface CustomerAddressInputPayload {
  label?: unknown;
  recipientName?: unknown;
  recipient_name?: unknown;
  phone?: unknown;
  line1?: unknown;
  line_1?: unknown;
  line2?: unknown;
  line_2?: unknown;
  city?: unknown;
  province?: unknown;
  postalCode?: unknown;
  postal_code?: unknown;
  countryCode?: unknown;
  country_code?: unknown;
  deliveryNotes?: unknown;
  delivery_notes?: unknown;
  isDefault?: unknown;
  is_default?: unknown;
}

const MAX_CUSTOMER_ADDRESSES = 10;

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return false;
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

function normalizeAddressLabel(value: unknown): CustomerAddressLabel {
  if (value === "casa" || value === "trabajo") {
    return value;
  }

  return "otro";
}

function normalizeCustomerAddressInput(
  input: CustomerAddressInputPayload,
  { partial = false }: { partial?: boolean } = {}
): CustomerAddressInput {
  const hasLabel = input.label !== undefined;
  const hasRecipientName = input.recipientName !== undefined || input.recipient_name !== undefined;
  const hasPhone = input.phone !== undefined;
  const hasLine1 = input.line1 !== undefined || input.line_1 !== undefined;
  const hasLine2 = input.line2 !== undefined || input.line_2 !== undefined;
  const hasCity = input.city !== undefined;
  const hasProvince = input.province !== undefined;
  const hasPostalCode = input.postalCode !== undefined || input.postal_code !== undefined;
  const hasCountryCode = input.countryCode !== undefined || input.country_code !== undefined;
  const hasDeliveryNotes = input.deliveryNotes !== undefined || input.delivery_notes !== undefined;
  const hasIsDefault = input.isDefault !== undefined || input.is_default !== undefined;
  const normalized: CustomerAddressInput = {};

  if (!partial || hasLabel) {
    normalized.label = normalizeAddressLabel(input.label);
  }

  if (!partial || hasRecipientName) {
    normalized.recipientName = safeString(input.recipientName ?? input.recipient_name);
  }

  if (!partial || hasPhone) {
    normalized.phone = safeString(input.phone);
  }

  if (!partial || hasLine1) {
    normalized.line1 = safeString(input.line1 ?? input.line_1);
  }

  if (!partial || hasLine2) {
    normalized.line2 = safeString(input.line2 ?? input.line_2);
  }

  if (!partial || hasCity) {
    normalized.city = safeString(input.city);
  }

  if (!partial || hasProvince) {
    normalized.province = safeString(input.province);
  }

  if (!partial || hasPostalCode) {
    normalized.postalCode = safeString(input.postalCode ?? input.postal_code);
  }

  if (!partial || hasCountryCode) {
    normalized.countryCode = "AR";
  }

  if (!partial || hasDeliveryNotes) {
    normalized.deliveryNotes = safeString(input.deliveryNotes ?? input.delivery_notes);
  }

  if (!partial || hasIsDefault) {
    normalized.isDefault = parseBoolean(input.isDefault ?? input.is_default);
  }

  if (partial && Object.keys(normalized).length === 0) {
    throw createHttpError(400, "No se enviaron datos para actualizar la direccion.");
  }

  return normalized;
}

function validateCustomerAddress(input: CustomerAddressInput): void {
  if (!input.recipientName || input.recipientName.length < 3 || input.recipientName.length > 80) {
    throw createHttpError(400, "El destinatario debe tener entre 3 y 80 caracteres.");
  }

  if (!input.phone || input.phone.length < 8 || input.phone.length > 20) {
    throw createHttpError(400, "El telefono debe tener entre 8 y 20 caracteres.");
  }

  if (!input.line1 || input.line1.length < 5 || input.line1.length > 120) {
    throw createHttpError(400, "La direccion principal debe tener entre 5 y 120 caracteres.");
  }

  if (input.line2 && input.line2.length > 120) {
    throw createHttpError(400, "La direccion complementaria no puede superar 120 caracteres.");
  }

  if (!input.city || input.city.length < 2 || input.city.length > 80) {
    throw createHttpError(400, "La ciudad debe tener entre 2 y 80 caracteres.");
  }

  if (!input.province || input.province.length < 2 || input.province.length > 80) {
    throw createHttpError(400, "La provincia debe tener entre 2 y 80 caracteres.");
  }

  if (!input.postalCode || input.postalCode.length < 4 || input.postalCode.length > 10) {
    throw createHttpError(400, "El codigo postal debe tener entre 4 y 10 caracteres.");
  }

  if (input.deliveryNotes && input.deliveryNotes.length > 160) {
    throw createHttpError(400, "Las notas de entrega no pueden superar 160 caracteres.");
  }
}

function toRawCustomerAddressRecord(
  id: string,
  customerUid: string,
  data: Record<string, unknown>
): RawCustomerAddressRecord {
  return {
    id,
    customerUid,
    label: normalizeAddressLabel(data.label),
    recipientName: safeString(data.recipientName),
    phone: safeString(data.phone),
    line1: safeString(data.line1),
    line2: safeString(data.line2),
    city: safeString(data.city),
    province: safeString(data.province),
    postalCode: safeString(data.postalCode),
    countryCode: "AR",
    deliveryNotes: safeString(data.deliveryNotes),
    isDefault: Boolean(data.isDefault),
    createdAt: readDateField(data, "createdAt"),
    updatedAt: readDateField(data, "updatedAt"),
    lastUsedAt: readDateField(data, "lastUsedAt"),
  };
}

function serializeCustomerAddress(address: RawCustomerAddressRecord): CustomerAddress {
  return {
    id: address.id,
    customer_uid: address.customerUid,
    label: address.label,
    recipient_name: address.recipientName,
    phone: address.phone,
    line_1: address.line1,
    line_2: address.line2,
    city: address.city,
    province: address.province,
    postal_code: address.postalCode,
    country_code: "AR",
    delivery_notes: address.deliveryNotes,
    is_default: address.isDefault,
    created_at: toIsoString(address.createdAt),
    updated_at: toIsoString(address.updatedAt),
    last_used_at: toIsoString(address.lastUsedAt),
  };
}

function sortAddresses(addresses: CustomerAddress[]): CustomerAddress[] {
  return [...addresses].sort((left, right) => {
    if (left.is_default && !right.is_default) {
      return -1;
    }

    if (!left.is_default && right.is_default) {
      return 1;
    }

    return (right.updated_at || "").localeCompare(left.updated_at || "");
  });
}

async function getAddressesCollection(customerUid: string) {
  const db = getFirebaseAdminDb();
  return db.collection("customers").doc(customerUid).collection("addresses");
}

export async function listCustomerAddresses(customerUid: string): Promise<CustomerAddress[]> {
  const normalizedUid = safeString(customerUid);

  if (!normalizedUid) {
    throw createHttpError(400, "El uid del cliente es requerido.");
  }

  const collection = await getAddressesCollection(normalizedUid);
  const snapshot = await collection.get();
  const addresses = snapshot.docs.map((doc) =>
    serializeCustomerAddress(toRawCustomerAddressRecord(doc.id, normalizedUid, doc.data() ?? {}))
  );

  return sortAddresses(addresses);
}

export async function getCustomerAddressById(
  customerUid: string,
  addressId: string
): Promise<CustomerAddress | null> {
  const normalizedUid = safeString(customerUid);
  const normalizedAddressId = safeString(addressId);

  if (!normalizedUid || !normalizedAddressId) {
    throw createHttpError(400, "La direccion es requerida.");
  }

  const collection = await getAddressesCollection(normalizedUid);
  const doc = await collection.doc(normalizedAddressId).get();

  if (!doc.exists) {
    return null;
  }

  return serializeCustomerAddress(
    toRawCustomerAddressRecord(doc.id, normalizedUid, doc.data() ?? {})
  );
}

export async function createCustomerAddress(
  customerUid: string,
  payload: CustomerAddressInputPayload
): Promise<CustomerAddress> {
  const normalizedUid = safeString(customerUid);
  const normalized = normalizeCustomerAddressInput(payload);
  validateCustomerAddress(normalized);
  const db = getFirebaseAdminDb();
  const customerRef = db.collection("customers").doc(normalizedUid);
  const addressesRef = customerRef.collection("addresses");
  const addressRef = addressesRef.doc();
  const now = new Date();

  await db.runTransaction(async (transaction) => {
    const customerDoc = await transaction.get(customerRef);

    if (!customerDoc.exists) {
      throw createHttpError(404, "Perfil de cliente no encontrado.");
    }

    const snapshot = await transaction.get(addressesRef);

    if (snapshot.size >= MAX_CUSTOMER_ADDRESSES) {
      throw createHttpError(400, "Solo puedes guardar hasta 10 direcciones.");
    }

    const shouldBeDefault = normalized.isDefault || snapshot.empty;

    if (shouldBeDefault) {
      snapshot.docs.forEach((doc) => {
        transaction.update(doc.ref, { isDefault: false, updatedAt: now });
      });
    }

    transaction.set(addressRef, {
      customerUid: normalizedUid,
      label: normalized.label || "otro",
      recipientName: normalized.recipientName,
      phone: normalized.phone,
      line1: normalized.line1,
      line2: normalized.line2 || "",
      city: normalized.city,
      province: normalized.province,
      postalCode: normalized.postalCode,
      countryCode: "AR",
      deliveryNotes: normalized.deliveryNotes || "",
      isDefault: Boolean(shouldBeDefault),
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
    });

    if (shouldBeDefault) {
      transaction.set(
        customerRef,
        { defaultAddressId: addressRef.id, updatedAt: now },
        { merge: true }
      );
    }
  });

  const address = await getCustomerAddressById(normalizedUid, addressRef.id);

  if (!address) {
    throw createHttpError(500, "No se pudo guardar la direccion.");
  }

  return address;
}

export async function updateCustomerAddress(
  customerUid: string,
  addressId: string,
  payload: CustomerAddressInputPayload
): Promise<CustomerAddress> {
  const normalizedUid = safeString(customerUid);
  const normalizedAddressId = safeString(addressId);
  const normalized = normalizeCustomerAddressInput(payload, { partial: true });
  const db = getFirebaseAdminDb();
  const customerRef = db.collection("customers").doc(normalizedUid);
  const addressRef = customerRef.collection("addresses").doc(normalizedAddressId);
  const now = new Date();

  await db.runTransaction(async (transaction) => {
    const addressDoc = await transaction.get(addressRef);

    if (!addressDoc.exists) {
      throw createHttpError(404, "Direccion no encontrada.");
    }

    const currentAddress = toRawCustomerAddressRecord(
      normalizedAddressId,
      normalizedUid,
      addressDoc.data() ?? {}
    );
    const nextAddress = {
      label: normalized.label ?? currentAddress.label,
      recipientName: normalized.recipientName ?? currentAddress.recipientName,
      phone: normalized.phone ?? currentAddress.phone,
      line1: normalized.line1 ?? currentAddress.line1,
      line2: normalized.line2 ?? currentAddress.line2,
      city: normalized.city ?? currentAddress.city,
      province: normalized.province ?? currentAddress.province,
      postalCode: normalized.postalCode ?? currentAddress.postalCode,
      countryCode: "AR" as const,
      deliveryNotes: normalized.deliveryNotes ?? currentAddress.deliveryNotes,
      isDefault:
        normalized.isDefault === true ? true : currentAddress.isDefault,
    };

    validateCustomerAddress(nextAddress);

    if (normalized.isDefault === true && !currentAddress.isDefault) {
      const snapshot = await transaction.get(customerRef.collection("addresses"));
      snapshot.docs.forEach((doc) => {
        if (doc.id !== normalizedAddressId) {
          transaction.update(doc.ref, { isDefault: false, updatedAt: now });
        }
      });

      transaction.set(
        customerRef,
        { defaultAddressId: normalizedAddressId, updatedAt: now },
        { merge: true }
      );
    }

    transaction.set(
      addressRef,
      {
        label: nextAddress.label,
        recipientName: nextAddress.recipientName,
        phone: nextAddress.phone,
        line1: nextAddress.line1,
        line2: nextAddress.line2,
        city: nextAddress.city,
        province: nextAddress.province,
        postalCode: nextAddress.postalCode,
        countryCode: "AR",
        deliveryNotes: nextAddress.deliveryNotes,
        isDefault: nextAddress.isDefault,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  const address = await getCustomerAddressById(normalizedUid, normalizedAddressId);

  if (!address) {
    throw createHttpError(500, "No se pudo actualizar la direccion.");
  }

  return address;
}

export async function setDefaultCustomerAddress(
  customerUid: string,
  addressId: string
): Promise<CustomerAddress> {
  const normalizedUid = safeString(customerUid);
  const normalizedAddressId = safeString(addressId);
  const db = getFirebaseAdminDb();
  const customerRef = db.collection("customers").doc(normalizedUid);
  const addressRef = customerRef.collection("addresses").doc(normalizedAddressId);
  const now = new Date();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(customerRef.collection("addresses"));

    if (!snapshot.docs.some((doc) => doc.id === normalizedAddressId)) {
      throw createHttpError(404, "Direccion no encontrada.");
    }

    snapshot.docs.forEach((doc) => {
      transaction.update(doc.ref, {
        isDefault: doc.id === normalizedAddressId,
        updatedAt: now,
      });
    });

    transaction.set(
      customerRef,
      { defaultAddressId: normalizedAddressId, updatedAt: now },
      { merge: true }
    );
  });

  const address = await getCustomerAddressById(normalizedUid, normalizedAddressId);

  if (!address) {
    throw createHttpError(500, "No se pudo actualizar la direccion predeterminada.");
  }

  return address;
}

export async function deleteCustomerAddress(
  customerUid: string,
  addressId: string
): Promise<{ deleted: true }> {
  const normalizedUid = safeString(customerUid);
  const normalizedAddressId = safeString(addressId);
  const db = getFirebaseAdminDb();
  const customerRef = db.collection("customers").doc(normalizedUid);
  const addressRef = customerRef.collection("addresses").doc(normalizedAddressId);
  const now = new Date();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(customerRef.collection("addresses"));
    const targetDoc = snapshot.docs.find((doc) => doc.id === normalizedAddressId);

    if (!targetDoc) {
      throw createHttpError(404, "Direccion no encontrada.");
    }

    const targetAddress = toRawCustomerAddressRecord(
      targetDoc.id,
      normalizedUid,
      targetDoc.data() ?? {}
    );

    transaction.delete(addressRef);

    if (targetAddress.isDefault) {
      const nextDefaultDoc = snapshot.docs.find((doc) => doc.id !== normalizedAddressId) || null;

      if (nextDefaultDoc) {
        transaction.update(nextDefaultDoc.ref, { isDefault: true, updatedAt: now });
        transaction.set(
          customerRef,
          { defaultAddressId: nextDefaultDoc.id, updatedAt: now },
          { merge: true }
        );
      } else {
        transaction.set(
          customerRef,
          { defaultAddressId: null, updatedAt: now },
          { merge: true }
        );
      }
    }
  });

  return { deleted: true };
}
