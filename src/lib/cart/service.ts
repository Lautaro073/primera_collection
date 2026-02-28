import crypto from "node:crypto";
import type { DocumentData, Transaction } from "firebase-admin/firestore";
import { createHttpError } from "@/lib/api/errors";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getProductById } from "@/lib/catalog/service";
import type {
  CartExistsResponse,
  CartIdResponse,
  CartItemRecord,
  DeleteResponse,
  Product,
  RawCartRecord,
  SerializedCartItem,
} from "@/types/domain";

type RawCartDocument = Omit<RawCartRecord, "id">;

function ensureCartId(id: string | null | undefined): string {
  const cartId = typeof id === "string" ? id.trim() : "";

  if (!cartId) {
    throw createHttpError(400, "El id del carrito es requerido.");
  }

  return cartId;
}

function normalizeQuantity(value: number | string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createHttpError(400, "La cantidad debe ser un entero mayor a 0.");
  }

  return parsed;
}

function serializeCartItem(product: Product, quantity: number): SerializedCartItem {
  return {
    cantidad: quantity,
    id_producto: product.id_producto,
    nombre: product.nombre,
    precio: product.precio,
    tag: product.tag,
    imagen: product.imagen,
  };
}

function toRawCartRecord(cartId: string, data: DocumentData): RawCartRecord {
  const items = Array.isArray(data.items)
    ? data.items
        .filter(
          (item): item is { productId?: unknown; quantity?: unknown } =>
            typeof item === "object" && item !== null
        )
        .map((item) => ({
          productId: typeof item.productId === "string" ? item.productId : "",
          quantity: Number(item.quantity) || 0,
        }))
        .filter((item): item is CartItemRecord => Boolean(item.productId) && item.quantity > 0)
    : [];

  return {
    id: cartId,
    items,
    createdAt: data.createdAt instanceof Date ? data.createdAt : undefined,
    updatedAt: data.updatedAt instanceof Date ? data.updatedAt : undefined,
  };
}

async function getCartDoc(cartId: string): Promise<RawCartRecord | null> {
  const db = getFirebaseAdminDb();
  const doc = await db.collection("carts").doc(cartId).get();

  return doc.exists ? toRawCartRecord(doc.id, doc.data() ?? {}) : null;
}

async function ensureCartDocument(cartId: string): Promise<RawCartRecord> {
  const db = getFirebaseAdminDb();
  const existing = await getCartDoc(cartId);

  if (existing) {
    return existing;
  }

  const now = new Date();
  const payload: RawCartDocument = {
    items: [],
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("carts").doc(cartId).set(payload);

  return {
    id: cartId,
    ...payload,
  };
}

async function enrichItems(items: CartItemRecord[] = []): Promise<SerializedCartItem[]> {
  const hydratedItems = await Promise.all(
    items.map(async (item) => {
      const product = await getProductById(item.productId);

      if (!product) {
        return null;
      }

      return serializeCartItem(product, item.quantity);
    })
  );

  return hydratedItems.filter((item): item is SerializedCartItem => item !== null);
}

function readTransactionCartData(doc: { exists: boolean; data(): DocumentData | undefined }): RawCartDocument {
  if (!doc.exists) {
    return { items: [] };
  }

  const data = doc.data() ?? {};
  const normalized = toRawCartRecord("", data);

  return {
    items: normalized.items,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
  };
}

export function createAnonymousSessionId(): string {
  return crypto.randomUUID();
}

export async function createCart(id: string = createAnonymousSessionId()): Promise<CartIdResponse> {
  const cartId = ensureCartId(id);
  const existing = await getCartDoc(cartId);

  if (existing) {
    return { id_carrito: cartId };
  }

  await ensureCartDocument(cartId);
  return { id_carrito: cartId };
}

export async function saveCartId(cartId: string): Promise<CartIdResponse> {
  const normalizedCartId = ensureCartId(cartId);
  const existing = await getCartDoc(normalizedCartId);

  if (existing) {
    throw createHttpError(409, "El ID del carrito ya existe en la base de datos.");
  }

  await ensureCartDocument(normalizedCartId);
  return { id_carrito: normalizedCartId };
}

export async function cartExists(cartId: string): Promise<CartExistsResponse> {
  const normalizedCartId = ensureCartId(cartId);
  const cart = await getCartDoc(normalizedCartId);
  return { exists: Boolean(cart) };
}

export async function getCartItems(cartId: string): Promise<SerializedCartItem[]> {
  const normalizedCartId = ensureCartId(cartId);
  const cart = await getCartDoc(normalizedCartId);

  if (!cart) {
    return [];
  }

  return enrichItems(cart.items);
}

export async function addOrUpdateCartItem(
  cartId: string,
  productId: string,
  quantity: number | string
): Promise<SerializedCartItem[]> {
  const normalizedCartId = ensureCartId(cartId);
  const normalizedProductId = ensureCartId(productId);
  const normalizedQuantity = normalizeQuantity(quantity);
  const existingProduct = await getProductById(normalizedProductId);

  if (!existingProduct) {
    throw createHttpError(404, "Producto no encontrado.");
  }

  const db = getFirebaseAdminDb();

  await db.runTransaction(async (transaction: Transaction) => {
    const ref = db.collection("carts").doc(normalizedCartId);
    const doc = await transaction.get(ref);
    const currentData = readTransactionCartData(doc);
    const items = [...currentData.items];
    const itemIndex = items.findIndex(
      (item) => item.productId === normalizedProductId
    );

    if (itemIndex >= 0) {
      items[itemIndex] = {
        ...items[itemIndex],
        quantity: items[itemIndex].quantity + normalizedQuantity,
      };
    } else {
      items.push({
        productId: normalizedProductId,
        quantity: normalizedQuantity,
      });
    }

    transaction.set(
      ref,
      {
        items,
        updatedAt: new Date(),
        createdAt: currentData.createdAt || new Date(),
      },
      { merge: true }
    );
  });

  return getCartItems(normalizedCartId);
}

export async function replaceCartItemQuantity(
  cartId: string,
  productId: string,
  quantity: number | string
): Promise<SerializedCartItem[]> {
  const normalizedCartId = ensureCartId(cartId);
  const normalizedProductId = ensureCartId(productId);
  const normalizedQuantity = normalizeQuantity(quantity);
  const db = getFirebaseAdminDb();

  await db.runTransaction(async (transaction: Transaction) => {
    const ref = db.collection("carts").doc(normalizedCartId);
    const doc = await transaction.get(ref);

    if (!doc.exists) {
      throw createHttpError(404, "Carrito no encontrado.");
    }

    const currentData = readTransactionCartData(doc);
    const items = [...currentData.items];
    const itemIndex = items.findIndex(
      (item) => item.productId === normalizedProductId
    );

    if (itemIndex < 0) {
      throw createHttpError(404, "El producto no existe en el carrito.");
    }

    items[itemIndex] = {
      ...items[itemIndex],
      quantity: normalizedQuantity,
    };

    transaction.update(ref, {
      items,
      updatedAt: new Date(),
    });
  });

  return getCartItems(normalizedCartId);
}

export async function removeCartItem(cartId: string, productId: string): Promise<DeleteResponse> {
  const normalizedCartId = ensureCartId(cartId);
  const normalizedProductId = ensureCartId(productId);
  const db = getFirebaseAdminDb();

  await db.runTransaction(async (transaction: Transaction) => {
    const ref = db.collection("carts").doc(normalizedCartId);
    const doc = await transaction.get(ref);

    if (!doc.exists) {
      return;
    }

    const currentData = readTransactionCartData(doc);
    const nextItems = currentData.items.filter((item) => item.productId !== normalizedProductId);

    transaction.update(ref, {
      items: nextItems,
      updatedAt: new Date(),
    });
  });

  return { deleted: true };
}
