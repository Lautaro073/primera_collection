import crypto from "node:crypto";
import type { DocumentData } from "firebase-admin/firestore";
import { createHttpError } from "@/lib/api/errors";
import { getProductById } from "@/lib/catalog/service";
import { getCustomerProfileByUid, setCustomerActiveCartId } from "@/lib/customer/service";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getProductVariants, getVariantStock } from "@/lib/storefront";
import type {
  CartExistsResponse,
  CartIdResponse,
  CartItemRecord,
  CartOwnerType,
  CartStatus,
  DeleteResponse,
  FirebaseDateLike,
  Product,
  RawCartRecord,
  SerializedCartItem,
} from "@/types/domain";
import { isRecord } from "@/types/shared";

type RawCartDocument = Omit<RawCartRecord, "id">;

export interface CartSessionState {
  id_carrito: string;
  items: SerializedCartItem[];
  merged: boolean;
  owner_type: CartOwnerType;
  restored: boolean;
}

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

function normalizeSelectedMeasure(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}

function normalizeOwnerType(value: unknown): CartOwnerType {
  return value === "customer" ? "customer" : "anonymous";
}

function normalizeCartStatus(value: unknown): CartStatus {
  if (value === "merged" || value === "abandoned") {
    return value;
  }

  return "active";
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

function getCartItemKey(productId: string, selectedMeasure: string | null): string {
  return `${productId}::${selectedMeasure || ""}`;
}

function serializeCartItem(
  product: Product,
  quantity: number,
  selectedMeasure: string | null
): SerializedCartItem {
  const stock = selectedMeasure ? getVariantStock(product, selectedMeasure) : product.stock;

  return {
    clave: getCartItemKey(product.id_producto, selectedMeasure),
    cantidad: quantity,
    id_producto: product.id_producto,
    medida_seleccionada: selectedMeasure,
    stock,
    nombre: product.nombre,
    precio: product.precio,
    precio_lista: product.precio_lista,
    precio_promocional: product.precio_promocional,
    tiene_promocion: product.tiene_promocion,
    tag: product.tag,
    imagen: product.imagen,
  };
}

function toRawCartRecord(cartId: string, data: DocumentData): RawCartRecord {
  const items = Array.isArray(data.items)
    ? data.items
        .filter(
          (item): item is {
            productId?: unknown;
            quantity?: unknown;
            selectedMeasure?: unknown;
          } => typeof item === "object" && item !== null
        )
        .map((item) => ({
          productId: typeof item.productId === "string" ? item.productId : "",
          quantity: Number(item.quantity) || 0,
          selectedMeasure:
            typeof item.selectedMeasure === "string"
              ? normalizeSelectedMeasure(item.selectedMeasure)
              : null,
        }))
        .filter((item) => Boolean(item.productId) && item.quantity > 0) as CartItemRecord[]
    : [];

  return {
    id: cartId,
    items,
    customerUid: typeof data.customerUid === "string" ? data.customerUid : null,
    ownerType: normalizeOwnerType(data.ownerType),
    status: normalizeCartStatus(data.status),
    mergedIntoCartId: typeof data.mergedIntoCartId === "string" ? data.mergedIntoCartId : null,
    createdAt: readDateField(data, "createdAt"),
    updatedAt: readDateField(data, "updatedAt"),
    lastActivityAt: readDateField(data, "lastActivityAt"),
  };
}

async function getCartDoc(cartId: string): Promise<RawCartRecord | null> {
  const db = getFirebaseAdminDb();
  const doc = await db.collection("carts").doc(cartId).get();

  return doc.exists ? toRawCartRecord(doc.id, doc.data() ?? {}) : null;
}

async function ensureCartDocument(
  cartId: string,
  {
    customerUid = null,
    ownerType = "anonymous",
  }: {
    customerUid?: string | null;
    ownerType?: CartOwnerType;
  } = {}
): Promise<RawCartRecord> {
  const db = getFirebaseAdminDb();
  const existing = await getCartDoc(cartId);

  if (existing) {
    return existing;
  }

  const now = new Date();
  const payload: RawCartDocument = {
    items: [],
    customerUid,
    ownerType,
    status: "active",
    mergedIntoCartId: null,
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
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

      return serializeCartItem(
        product,
        item.quantity,
        normalizeSelectedMeasure(item.selectedMeasure)
      );
    })
  );

  return hydratedItems.filter((item): item is SerializedCartItem => item !== null);
}

function readTransactionCartData(doc: {
  exists: boolean;
  data(): DocumentData | undefined;
}): RawCartDocument {
  if (!doc.exists) {
    return {
      items: [],
      customerUid: null,
      ownerType: "anonymous",
      status: "active",
      mergedIntoCartId: null,
    };
  }

  const data = doc.data() ?? {};
  const normalized = toRawCartRecord("", data);

  return {
    items: normalized.items,
    customerUid: normalized.customerUid,
    ownerType: normalized.ownerType,
    status: normalized.status,
    mergedIntoCartId: normalized.mergedIntoCartId,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
    lastActivityAt: normalized.lastActivityAt,
  };
}

function canUseSelectedMeasure(product: Product, selectedMeasure: string | null): boolean {
  if (!selectedMeasure) {
    return product.medidas.length === 0;
  }

  return getProductVariants(product).some((variant) => variant.medida === selectedMeasure);
}

function getStockLimit(product: Product, selectedMeasure: string | null): number {
  return selectedMeasure ? getVariantStock(product, selectedMeasure) : product.stock;
}

function getTrackedQuantity(
  items: CartItemRecord[],
  productId: string,
  selectedMeasure: string | null,
  useVariantStock: boolean
): number {
  return items.reduce((total, item) => {
    const sameProduct = item.productId === productId;
    const sameMeasure =
      normalizeSelectedMeasure(item.selectedMeasure) === normalizeSelectedMeasure(selectedMeasure);

    if (!sameProduct) {
      return total;
    }

    if (useVariantStock) {
      return sameMeasure ? total + item.quantity : total;
    }

    return total + item.quantity;
  }, 0);
}

async function buildMergedItems(
  baseItems: CartItemRecord[],
  incomingItems: CartItemRecord[]
): Promise<CartItemRecord[]> {
  const mergedItems = baseItems.map((item) => ({ ...item }));
  const productCache = new Map<string, Product | null>();

  async function getCachedProduct(productId: string): Promise<Product | null> {
    if (!productCache.has(productId)) {
      productCache.set(productId, await getProductById(productId));
    }

    return productCache.get(productId) ?? null;
  }

  for (const item of incomingItems) {
    const product = await getCachedProduct(item.productId);

    if (!product) {
      continue;
    }

    const selectedMeasure = normalizeSelectedMeasure(item.selectedMeasure);

    if (!canUseSelectedMeasure(product, selectedMeasure)) {
      continue;
    }

    const useVariantStock = product.variantes.length > 0;
    const totalForProduct = getTrackedQuantity(
      mergedItems,
      item.productId,
      selectedMeasure,
      useVariantStock
    );
    const availableQuantity = Math.max(0, getStockLimit(product, selectedMeasure) - totalForProduct);

    if (availableQuantity === 0) {
      continue;
    }

    const quantityToAdd = Math.min(item.quantity, availableQuantity);
    const lineIndex = mergedItems.findIndex(
      (currentItem) =>
        currentItem.productId === item.productId &&
        normalizeSelectedMeasure(currentItem.selectedMeasure) === selectedMeasure
    );

    if (lineIndex >= 0) {
      mergedItems[lineIndex] = {
        ...mergedItems[lineIndex],
        quantity: mergedItems[lineIndex].quantity + quantityToAdd,
        selectedMeasure: selectedMeasure || undefined,
      };
      continue;
    }

    mergedItems.push({
      productId: item.productId,
      quantity: quantityToAdd,
      selectedMeasure: selectedMeasure || undefined,
    });
  }

  return mergedItems;
}

async function getOrCreateCustomerCart(uid: string): Promise<RawCartRecord> {
  const customer = await getCustomerProfileByUid(uid);
  const activeCartId = customer?.active_cart_id || null;

  if (activeCartId) {
    const existingCart = await getCartDoc(activeCartId);

    if (
      existingCart &&
      existingCart.ownerType === "customer" &&
      existingCart.customerUid === uid &&
      existingCart.status === "active"
    ) {
      return existingCart;
    }
  }

  const createdCart = await createCart(undefined, {
    ownerType: "customer",
    customerUid: uid,
  });
  await setCustomerActiveCartId(uid, createdCart.id_carrito);

  const customerCart = await getCartDoc(createdCart.id_carrito);

  if (!customerCart) {
    throw createHttpError(500, "No se pudo inicializar el carrito del cliente.");
  }

  return customerCart;
}

async function mergeAnonymousCartIntoCustomerCart(
  uid: string,
  customerCart: RawCartRecord,
  anonymousCart: RawCartRecord
): Promise<RawCartRecord> {
  if (anonymousCart.status === "merged") {
    return customerCart;
  }

  const mergedItems = await buildMergedItems(customerCart.items, anonymousCart.items);
  const db = getFirebaseAdminDb();
  const now = new Date();

  await db.runTransaction(async (transaction) => {
    const customerCartRef = db.collection("carts").doc(customerCart.id);
    const anonymousCartRef = db.collection("carts").doc(anonymousCart.id);
    const customerRef = db.collection("customers").doc(uid);

    transaction.set(
      customerCartRef,
      {
        items: mergedItems,
        customerUid: uid,
        ownerType: "customer",
        status: "active",
        mergedIntoCartId: null,
        updatedAt: now,
        lastActivityAt: now,
      },
      { merge: true }
    );

    transaction.set(
      anonymousCartRef,
      {
        status: "merged",
        mergedIntoCartId: customerCart.id,
        updatedAt: now,
      },
      { merge: true }
    );

    transaction.set(
      customerRef,
      {
        activeCartId: customerCart.id,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  const refreshedCart = await getCartDoc(customerCart.id);

  if (!refreshedCart) {
    throw createHttpError(500, "No se pudo sincronizar el carrito del cliente.");
  }

  return refreshedCart;
}

async function syncAnonymousCartSession(cartId: string | null): Promise<CartSessionState> {
  if (cartId) {
    const existingCart = await getCartDoc(cartId);

    if (existingCart && existingCart.ownerType === "anonymous" && existingCart.status === "active") {
      return {
        id_carrito: existingCart.id,
        items: await enrichItems(existingCart.items),
        merged: false,
        owner_type: "anonymous",
        restored: true,
      };
    }
  }

  const createdCart = await createCart();
  return {
    id_carrito: createdCart.id_carrito,
    items: [],
    merged: false,
    owner_type: "anonymous",
    restored: false,
  };
}

async function syncCustomerCartSession(
  uid: string,
  incomingCartId: string | null
): Promise<CartSessionState> {
  let customerCart = await getOrCreateCustomerCart(uid);
  let merged = false;

  if (incomingCartId && incomingCartId !== customerCart.id) {
    const incomingCart = await getCartDoc(incomingCartId);

    if (
      incomingCart &&
      incomingCart.ownerType === "anonymous" &&
      incomingCart.status === "active"
    ) {
      customerCart = await mergeAnonymousCartIntoCustomerCart(uid, customerCart, incomingCart);
      merged = true;
    }
  }

  await setCustomerActiveCartId(uid, customerCart.id);

  return {
    id_carrito: customerCart.id,
    items: await enrichItems(customerCart.items),
    merged,
    owner_type: "customer",
    restored: true,
  };
}

export async function syncCartSession(
  cartId: string | null,
  customerUid: string | null
): Promise<CartSessionState> {
  if (customerUid) {
    return syncCustomerCartSession(customerUid, cartId);
  }

  return syncAnonymousCartSession(cartId);
}

export async function assertCartAccess(
  cartId: string,
  customerUid: string | null
): Promise<RawCartRecord> {
  const normalizedCartId = ensureCartId(cartId);
  const cart = await getCartDoc(normalizedCartId);

  if (!cart || cart.status !== "active") {
    throw createHttpError(404, "Carrito no encontrado.");
  }

  if (cart.ownerType === "anonymous") {
    return cart;
  }

  if (customerUid && cart.customerUid === customerUid) {
    return cart;
  }

  throw createHttpError(404, "Carrito no encontrado.");
}

export function createAnonymousSessionId(): string {
  return crypto.randomUUID();
}

export async function createCart(
  id: string = createAnonymousSessionId(),
  {
    customerUid = null,
    ownerType = "anonymous",
  }: {
    customerUid?: string | null;
    ownerType?: CartOwnerType;
  } = {}
): Promise<CartIdResponse> {
  const cartId = ensureCartId(id);
  const existing = await getCartDoc(cartId);

  if (existing) {
    return { id_carrito: cartId, owner_type: existing.ownerType };
  }

  await ensureCartDocument(cartId, { customerUid, ownerType });
  return { id_carrito: cartId, owner_type: ownerType };
}

export async function saveCartId(cartId: string): Promise<CartIdResponse> {
  const normalizedCartId = ensureCartId(cartId);
  const existing = await getCartDoc(normalizedCartId);

  if (existing) {
    throw createHttpError(409, "El ID del carrito ya existe en la base de datos.");
  }

  await ensureCartDocument(normalizedCartId);
  return { id_carrito: normalizedCartId, owner_type: "anonymous" };
}

export async function cartExists(cartId: string): Promise<CartExistsResponse> {
  const normalizedCartId = ensureCartId(cartId);
  const cart = await getCartDoc(normalizedCartId);
  return { exists: Boolean(cart && cart.status === "active") };
}

export async function getCartItems(
  cartId: string,
  customerUid: string | null = null
): Promise<SerializedCartItem[]> {
  const cart = await assertCartAccess(cartId, customerUid);
  return enrichItems(cart.items);
}

export async function addOrUpdateCartItem(
  cartId: string,
  productId: string,
  quantity: number | string,
  selectedMeasure?: string | null,
  customerUid: string | null = null
): Promise<SerializedCartItem[]> {
  const normalizedCartId = ensureCartId(cartId);
  const normalizedProductId = ensureCartId(productId);
  const normalizedQuantity = normalizeQuantity(quantity);
  const normalizedSelectedMeasure = normalizeSelectedMeasure(selectedMeasure);
  const existingProduct = await getProductById(normalizedProductId);

  if (!existingProduct) {
    throw createHttpError(404, "Producto no encontrado.");
  }

  if (
    normalizedSelectedMeasure &&
    !existingProduct.medidas.includes(normalizedSelectedMeasure)
  ) {
    throw createHttpError(400, "El talle seleccionado no existe para este producto.");
  }

  if (existingProduct.medidas.length > 0 && !normalizedSelectedMeasure) {
    throw createHttpError(400, "Debes seleccionar un talle antes de agregar.");
  }

  const db = getFirebaseAdminDb();

  await db.runTransaction(async (transaction) => {
    const ref = db.collection("carts").doc(normalizedCartId);
    const doc = await transaction.get(ref);

    if (!doc.exists) {
      throw createHttpError(404, "Carrito no encontrado.");
    }

    const currentCart = toRawCartRecord(normalizedCartId, doc.data() ?? {});

    if (currentCart.status !== "active") {
      throw createHttpError(404, "Carrito no encontrado.");
    }

    if (currentCart.ownerType === "customer" && currentCart.customerUid !== customerUid) {
      throw createHttpError(404, "Carrito no encontrado.");
    }

    const currentData = readTransactionCartData(doc);
    const items = [...currentData.items];
    const useVariantStock = existingProduct.variantes.length > 0;
    const totalForProduct = getTrackedQuantity(
      items,
      normalizedProductId,
      normalizedSelectedMeasure,
      useVariantStock
    );

    if (totalForProduct + normalizedQuantity > getStockLimit(existingProduct, normalizedSelectedMeasure)) {
      throw createHttpError(400, "No hay stock suficiente para este producto.");
    }

    const itemIndex = items.findIndex(
      (item) =>
        item.productId === normalizedProductId &&
        normalizeSelectedMeasure(item.selectedMeasure) === normalizedSelectedMeasure
    );

    if (itemIndex >= 0) {
      items[itemIndex] = {
        ...items[itemIndex],
        quantity: items[itemIndex].quantity + normalizedQuantity,
        selectedMeasure: normalizedSelectedMeasure || undefined,
      };
    } else {
      items.push({
        productId: normalizedProductId,
        quantity: normalizedQuantity,
        selectedMeasure: normalizedSelectedMeasure || undefined,
      });
    }

    transaction.set(
      ref,
      {
        items,
        updatedAt: new Date(),
        createdAt: currentData.createdAt || new Date(),
        lastActivityAt: new Date(),
        ownerType: currentCart.ownerType,
        customerUid: currentCart.customerUid || null,
        status: "active",
      },
      { merge: true }
    );
  });

  return getCartItems(normalizedCartId, customerUid);
}

export async function replaceCartItemQuantity(
  cartId: string,
  productId: string,
  quantity: number | string,
  selectedMeasure?: string | null,
  customerUid: string | null = null
): Promise<SerializedCartItem[]> {
  const normalizedCartId = ensureCartId(cartId);
  const normalizedProductId = ensureCartId(productId);
  const normalizedQuantity = normalizeQuantity(quantity);
  const normalizedSelectedMeasure = normalizeSelectedMeasure(selectedMeasure);
  const existingProduct = await getProductById(normalizedProductId);
  const db = getFirebaseAdminDb();

  if (!existingProduct) {
    throw createHttpError(404, "Producto no encontrado.");
  }

  await db.runTransaction(async (transaction) => {
    const ref = db.collection("carts").doc(normalizedCartId);
    const doc = await transaction.get(ref);

    if (!doc.exists) {
      throw createHttpError(404, "Carrito no encontrado.");
    }

    const currentCart = toRawCartRecord(normalizedCartId, doc.data() ?? {});

    if (currentCart.status !== "active") {
      throw createHttpError(404, "Carrito no encontrado.");
    }

    if (currentCart.ownerType === "customer" && currentCart.customerUid !== customerUid) {
      throw createHttpError(404, "Carrito no encontrado.");
    }

    const currentData = readTransactionCartData(doc);
    const items = [...currentData.items];
    const itemIndex = items.findIndex(
      (item) =>
        item.productId === normalizedProductId &&
        normalizeSelectedMeasure(item.selectedMeasure) === normalizedSelectedMeasure
    );

    if (itemIndex < 0) {
      throw createHttpError(404, "El producto no existe en el carrito.");
    }

    const useVariantStock = existingProduct.variantes.length > 0;
    const totalForOtherLines = items.reduce((total, item, index) => {
      if (index === itemIndex || item.productId !== normalizedProductId) {
        return total;
      }

      if (useVariantStock) {
        return normalizeSelectedMeasure(item.selectedMeasure) === normalizedSelectedMeasure
          ? total + item.quantity
          : total;
      }

      return total + item.quantity;
    }, 0);

    if (totalForOtherLines + normalizedQuantity > getStockLimit(existingProduct, normalizedSelectedMeasure)) {
      throw createHttpError(400, "No hay stock suficiente para este producto.");
    }

    items[itemIndex] = {
      ...items[itemIndex],
      quantity: normalizedQuantity,
      selectedMeasure: normalizedSelectedMeasure || undefined,
    };

    transaction.update(ref, {
      items,
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    });
  });

  return getCartItems(normalizedCartId, customerUid);
}

export async function removeCartItem(
  cartId: string,
  productId: string,
  selectedMeasure?: string | null,
  customerUid: string | null = null
): Promise<DeleteResponse> {
  const normalizedCartId = ensureCartId(cartId);
  const normalizedProductId = ensureCartId(productId);
  const normalizedSelectedMeasure = normalizeSelectedMeasure(selectedMeasure);
  const db = getFirebaseAdminDb();

  await db.runTransaction(async (transaction) => {
    const ref = db.collection("carts").doc(normalizedCartId);
    const doc = await transaction.get(ref);

    if (!doc.exists) {
      return;
    }

    const currentCart = toRawCartRecord(normalizedCartId, doc.data() ?? {});

    if (currentCart.status !== "active") {
      throw createHttpError(404, "Carrito no encontrado.");
    }

    if (currentCart.ownerType === "customer" && currentCart.customerUid !== customerUid) {
      throw createHttpError(404, "Carrito no encontrado.");
    }

    const currentData = readTransactionCartData(doc);
    const nextItems = currentData.items.filter(
      (item) =>
        !(
          item.productId === normalizedProductId &&
          normalizeSelectedMeasure(item.selectedMeasure) === normalizedSelectedMeasure
        )
    );

    transaction.update(ref, {
      items: nextItems,
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    });
  });

  return { deleted: true };
}
