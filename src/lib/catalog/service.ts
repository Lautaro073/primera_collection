import crypto from "node:crypto";
import type { DocumentData } from "firebase-admin/firestore";
import { createHttpError } from "@/lib/api/errors";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { serializeCategory, serializeProduct } from "@/lib/catalog/serializers";
import type {
  Category,
  CategoryWithProducts,
  DeleteResponse,
  FirebaseDateLike,
  Product,
  ProductMeasureType,
  RawCategoryRecord,
  RawProductRecord,
} from "@/types/domain";
import { isRecord } from "@/types/shared";

interface CategoryInput {
  nombre_categoria?: unknown;
  name?: unknown;
  slug?: unknown;
}

interface ProductInput {
  nombre?: unknown;
  name?: unknown;
  descripcion?: unknown;
  description?: unknown;
  precio?: unknown;
  price?: unknown;
  id_categoria?: unknown;
  categoryId?: unknown;
  stock?: unknown;
  tag?: unknown;
  tipo_medida?: unknown;
  measureType?: unknown;
  medidas?: unknown;
  measureOptions?: unknown;
}

interface NormalizedCategoryInput {
  name: string;
  slug: string;
}

interface NormalizedProductInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  stock?: number;
  tag?: string | null;
  measureType?: ProductMeasureType;
  measureOptions?: string[];
}

interface ProductImageUploadResult {
  imagePath: string;
  imageUrl: string;
}

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface CloudinaryUploadResponse {
  secure_url?: unknown;
  public_id?: unknown;
  error?: {
    message?: unknown;
  };
}

interface CloudinaryDestroyResponse {
  result?: unknown;
  error?: {
    message?: unknown;
  };
}

interface ProductListOptions {
  limit?: number;
  offset?: number;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value: unknown): string {
  return safeString(value).toLowerCase();
}

function parseNumber(value: unknown, fallback: number | null = null): number | null {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeMeasureType(value: unknown): ProductMeasureType {
  if (value === "ropa" || value === "calzado") {
    return value;
  }

  return "none";
}

function normalizeMeasureOptions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => safeString(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function toComparableDate(value: FirebaseDateLike): number {
  if (!value) {
    return 0;
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value !== "string") {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortByCreatedAtDesc<T extends { createdAt?: FirebaseDateLike }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => toComparableDate(b.createdAt) - toComparableDate(a.createdAt)
  );
}

function slugify(value: unknown): string {
  return safeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategoryInput(input: CategoryInput): NormalizedCategoryInput {
  const name = safeString(input.nombre_categoria ?? input.name);
  const slug = safeString(input.slug) || slugify(name);

  if (!name) {
    throw createHttpError(400, "El nombre de la categoria es requerido.");
  }

  if (!slug) {
    throw createHttpError(400, "No se pudo generar un slug valido para la categoria.");
  }

  return { name, slug };
}

function normalizeProductInput(
  input: ProductInput,
  { partial = false }: { partial?: boolean } = {}
): NormalizedProductInput {
  const hasName = input.nombre !== undefined || input.name !== undefined;
  const hasDescription =
    input.descripcion !== undefined || input.description !== undefined;
  const hasPrice = input.precio !== undefined || input.price !== undefined;
  const hasCategory =
    input.id_categoria !== undefined || input.categoryId !== undefined;
  const hasStock = input.stock !== undefined;
  const hasTag = input.tag !== undefined;

  const normalized: NormalizedProductInput = {};

  if (!partial || hasName) {
    const name = safeString(input.nombre ?? input.name);

    if (!name) {
      throw createHttpError(400, "El nombre del producto es requerido.");
    }

    normalized.name = name;
  }

  if (!partial || hasDescription) {
    normalized.description = safeString(input.descripcion ?? input.description);
  }

  if (!partial || hasPrice) {
    const price = parseNumber(input.precio ?? input.price);

    if (price === null || price < 0) {
      throw createHttpError(400, "El precio del producto es invalido.");
    }

    normalized.price = price;
  }

  if (!partial || hasCategory) {
    const categoryId = safeString(input.id_categoria ?? input.categoryId);

    if (!categoryId) {
      throw createHttpError(400, "La categoria del producto es requerida.");
    }

    normalized.categoryId = categoryId;
  }

  if (!partial || hasStock) {
    const stock = parseNumber(input.stock);

    if (stock === null || stock < 0) {
      throw createHttpError(400, "El stock del producto es invalido.");
    }

    normalized.stock = stock;
  }

  if (!partial || hasTag) {
    normalized.tag = safeString(input.tag) || null;
  }

  const hasMeasureType =
    input.tipo_medida !== undefined || input.measureType !== undefined;
  const hasMeasureOptions =
    input.medidas !== undefined || input.measureOptions !== undefined;

  if (!partial || hasMeasureType || hasMeasureOptions) {
    const measureType = normalizeMeasureType(
      input.tipo_medida ?? input.measureType
    );
    const measureOptions = normalizeMeasureOptions(
      input.medidas ?? input.measureOptions
    );

    if (measureType !== "none" && measureOptions.length === 0) {
      throw createHttpError(
        400,
        "Debes indicar al menos una medida disponible para el producto."
      );
    }

    normalized.measureType = measureType;
    normalized.measureOptions = measureType === "none" ? [] : measureOptions;
  }

  if (partial && Object.keys(normalized).length === 0) {
    throw createHttpError(400, "No se enviaron datos para actualizar.");
  }

  return normalized;
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

function toRawCategoryRecord(id: string, data: DocumentData): RawCategoryRecord {
  return {
    id,
    name: safeString(data.name),
    slug: safeString(data.slug),
    createdAt: readDateField(data, "createdAt"),
    updatedAt: readDateField(data, "updatedAt"),
  };
}

function toRawProductRecord(id: string, data: DocumentData): RawProductRecord {
  const imageUrls = normalizeMeasureOptions(data.imageUrls);
  const imagePaths = normalizeMeasureOptions(data.imagePaths);
  const fallbackImageUrl = safeString(data.imageUrl);
  const fallbackImagePath = safeString(data.imagePath);

  return {
    id,
    name: safeString(data.name),
    description: safeString(data.description),
    price: parseNumber(data.price, 0),
    categoryId: safeString(data.categoryId) || null,
    stock: parseNumber(data.stock, 0),
    tag: safeString(data.tag) || null,
    measureType: normalizeMeasureType(data.measureType),
    measureOptions: normalizeMeasureOptions(data.measureOptions),
    imageUrl: fallbackImageUrl || imageUrls[0] || null,
    imagePath: fallbackImagePath || imagePaths[0] || null,
    imageUrls: imageUrls.length > 0 ? imageUrls : (fallbackImageUrl ? [fallbackImageUrl] : []),
    imagePaths: imagePaths.length > 0 ? imagePaths : (fallbackImagePath ? [fallbackImagePath] : []),
    createdAt: readDateField(data, "createdAt"),
    updatedAt: readDateField(data, "updatedAt"),
  };
}

async function readCollection<T extends RawCategoryRecord | RawProductRecord>(
  collectionName: "categories" | "products"
): Promise<T[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection(collectionName).get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() ?? {};

    if (collectionName === "categories") {
      return toRawCategoryRecord(doc.id, data) as T;
    }

    return toRawProductRecord(doc.id, data) as T;
  });
}

async function readCategoriesRaw(): Promise<RawCategoryRecord[]> {
  return readCollection<RawCategoryRecord>("categories");
}

async function readProductsRaw(): Promise<RawProductRecord[]> {
  return readCollection<RawProductRecord>("products");
}

async function getCategoryRawByIdentifier(identifier: string): Promise<RawCategoryRecord | null> {
  const normalizedIdentifier = normalizeText(identifier);
  const categories = await readCategoriesRaw();

  return (
    categories.find(
      (category) => normalizeText(category.slug) === normalizedIdentifier
    ) ||
    categories.find(
      (category) => normalizeText(category.name) === normalizedIdentifier
    ) ||
    null
  );
}

async function getCategoryDocById(id: string): Promise<RawCategoryRecord | null> {
  const db = getFirebaseAdminDb();
  const doc = await db.collection("categories").doc(id).get();
  return doc.exists ? toRawCategoryRecord(doc.id, doc.data() ?? {}) : null;
}

async function getProductDocById(id: string): Promise<RawProductRecord | null> {
  const db = getFirebaseAdminDb();
  const doc = await db.collection("products").doc(id).get();
  return doc.exists ? toRawProductRecord(doc.id, doc.data() ?? {}) : null;
}

async function ensureCategoryExists(categoryId: string): Promise<RawCategoryRecord> {
  const category = await getCategoryDocById(categoryId);

  if (!category) {
    throw createHttpError(404, "Categoria no encontrada.");
  }

  return category;
}

async function ensureUniqueCategory({
  name,
  slug,
  excludeId = null,
}: NormalizedCategoryInput & { excludeId?: string | null }): Promise<void> {
  const categories = await readCategoriesRaw();
  const duplicated = categories.find((category) => {
    if (excludeId && category.id === excludeId) {
      return false;
    }

    return (
      normalizeText(category.name) === normalizeText(name) ||
      normalizeText(category.slug) === normalizeText(slug)
    );
  });

  if (duplicated) {
    throw createHttpError(409, "Ya existe una categoria con ese nombre o slug.");
  }
}

function validateImageFile(image: File | null): void {
  if (!image) {
    return;
  }

  if (!image.type || !image.type.startsWith("image/")) {
    throw createHttpError(400, "El archivo debe ser una imagen valida.");
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

function getCloudinaryConfig(): CloudinaryConfig {
  return {
    cloudName: requiredEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: requiredEnv("CLOUDINARY_API_KEY"),
    apiSecret: requiredEnv("CLOUDINARY_API_SECRET"),
  };
}

function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

async function readCloudinaryResponse<T extends { error?: { message?: unknown } }>(
  response: Response
): Promise<T> {
  const payload = (await response.json()) as T;

  if (response.ok) {
    return payload;
  }

  const errorMessage =
    isRecord(payload.error) && typeof payload.error.message === "string"
      ? payload.error.message
      : "No se pudo subir la imagen.";

  throw createHttpError(502, errorMessage);
}

async function uploadProductImage(
  image: File | null
): Promise<ProductImageUploadResult | null> {
  if (!image) {
    return null;
  }

  validateImageFile(image);

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const buffer = Buffer.from(await image.arrayBuffer());
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `products/${Date.now()}-${crypto.randomUUID()}`;
  const signature = signCloudinaryParams(
    {
      public_id: publicId,
      timestamp,
    },
    apiSecret
  );
  const form = new FormData();

  form.append("file", new Blob([buffer], { type: image.type }), image.name || "product-image");
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("public_id", publicId);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: form,
    }
  );
  const payload = await readCloudinaryResponse<CloudinaryUploadResponse>(response);
  const imageUrl = safeString(payload.secure_url);
  const imagePath = safeString(payload.public_id);

  if (!imageUrl || !imagePath) {
    throw createHttpError(502, "Cloudinary no devolvio una imagen valida.");
  }

  return {
    imagePath,
    imageUrl,
  };
}

async function uploadProductImages(images: File[]): Promise<ProductImageUploadResult[]> {
  const uploads = await Promise.all(images.map((image) => uploadProductImage(image)));

  return uploads.filter(
    (upload): upload is ProductImageUploadResult => upload !== null
  );
}

async function deleteProductImage(imagePath: string | null): Promise<void> {
  if (!imagePath) {
    return;
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signCloudinaryParams(
    {
      public_id: imagePath,
      timestamp,
    },
    apiSecret
  );
  const body = new URLSearchParams({
    api_key: apiKey,
    public_id: imagePath,
    signature,
    timestamp: String(timestamp),
  });
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );
  const payload = await readCloudinaryResponse<CloudinaryDestroyResponse>(response);

  if (payload.result === "ok" || payload.result === "not found") {
    return;
  }

  throw createHttpError(502, "No se pudo eliminar la imagen en Cloudinary.");
}

async function deleteProductImages(imagePaths: string[]): Promise<void> {
  await Promise.all(imagePaths.map((imagePath) => deleteProductImage(imagePath)));
}

export async function listCategories(): Promise<Category[]> {
  const categories = await readCategoriesRaw();

  return categories
    .sort((a, b) => safeString(a.name).localeCompare(safeString(b.name), "es"))
    .map(serializeCategory);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const category = await getCategoryDocById(id);
  return category ? serializeCategory(category) : null;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const db = getFirebaseAdminDb();
  const normalized = normalizeCategoryInput(input);

  await ensureUniqueCategory(normalized);

  const now = new Date();
  const ref = await db.collection("categories").add({
    ...normalized,
    createdAt: now,
    updatedAt: now,
  });

  const created = await ref.get();
  return serializeCategory(toRawCategoryRecord(created.id, created.data() ?? {}));
}

export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<Category> {
  const db = getFirebaseAdminDb();
  const existing = await getCategoryDocById(id);

  if (!existing) {
    throw createHttpError(404, "Categoria no encontrada.");
  }

  const normalized = normalizeCategoryInput({
    name: input.name ?? input.nombre_categoria ?? existing.name,
    slug: input.slug ?? existing.slug,
  });

  await ensureUniqueCategory({ ...normalized, excludeId: id });

  const updatedAt = new Date();
  await db.collection("categories").doc(id).update({
    ...normalized,
    updatedAt,
  });

  return serializeCategory({
    ...existing,
    ...normalized,
    updatedAt,
  });
}

export async function deleteCategory(id: string): Promise<DeleteResponse> {
  const db = getFirebaseAdminDb();
  const [category, products] = await Promise.all([
    getCategoryDocById(id),
    readProductsRaw(),
  ]);

  if (!category) {
    throw createHttpError(404, "Categoria no encontrada.");
  }

  const linkedProducts = products.some((product) => product.categoryId === id);

  if (linkedProducts) {
    throw createHttpError(
      409,
      "No se puede eliminar la categoria porque tiene productos asociados."
    );
  }

  await db.collection("categories").doc(id).delete();
  return { deleted: true };
}

export async function getCategoryProductsByName(
  identifier: string
): Promise<Product[] | null> {
  const category = await getCategoryRawByIdentifier(identifier);

  if (!category) {
    return null;
  }

  const products = await readProductsRaw();
  return sortByCreatedAtDesc(
    products.filter((product) => product.categoryId === category.id)
  ).map(serializeProduct);
}

export async function listCategoriesWithProducts(): Promise<CategoryWithProducts[]> {
  const [categories, products] = await Promise.all([
    readCategoriesRaw(),
    readProductsRaw(),
  ]);

  const serializedProducts = sortByCreatedAtDesc(products).map(serializeProduct);

  return categories
    .sort((a, b) => safeString(a.name).localeCompare(safeString(b.name), "es"))
    .map((category) => {
      const serializedCategory = serializeCategory(category);

      return {
        ...serializedCategory,
        productos: serializedProducts.filter(
          (product) => product.id_categoria === serializedCategory.id_categoria
        ),
      };
    });
}

export async function listProducts(
  { limit = 15, offset = 0 }: ProductListOptions = {}
): Promise<Product[]> {
  const products = sortByCreatedAtDesc(await readProductsRaw());
  const normalizedOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;
  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? limit : 15;

  return products
    .slice(normalizedOffset, normalizedOffset + normalizedLimit)
    .map(serializeProduct);
}

export async function listAllProducts(): Promise<Product[]> {
  return sortByCreatedAtDesc(await readProductsRaw()).map(serializeProduct);
}

export async function searchProducts(term: string): Promise<Product[]> {
  const normalizedTerm = normalizeText(term);
  const products = sortByCreatedAtDesc(await readProductsRaw());

  return products
    .filter((product) => normalizeText(product.name).includes(normalizedTerm))
    .map(serializeProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const product = await getProductDocById(id);
  return product ? serializeProduct(product) : null;
}

export async function createProduct(
  input: ProductInput,
  images: File[]
): Promise<Product> {
  const db = getFirebaseAdminDb();
  const normalized = normalizeProductInput(input);

  if (!normalized.categoryId) {
    throw createHttpError(400, "La categoria del producto es requerida.");
  }

  await ensureCategoryExists(normalized.categoryId);

  const uploadedImages = await uploadProductImages(images);
  const now = new Date();
  const ref = await db.collection("products").add({
    ...normalized,
    imageUrl: uploadedImages[0]?.imageUrl || null,
    imagePath: uploadedImages[0]?.imagePath || null,
    imageUrls: uploadedImages.map((image) => image.imageUrl),
    imagePaths: uploadedImages.map((image) => image.imagePath),
    createdAt: now,
    updatedAt: now,
  });

  const created = await ref.get();
  return serializeProduct(toRawProductRecord(created.id, created.data() ?? {}));
}

export async function updateProduct(
  id: string,
  input: ProductInput,
  images: File[]
): Promise<Product> {
  const db = getFirebaseAdminDb();
  const existing = await getProductDocById(id);

  if (!existing) {
    throw createHttpError(404, "Producto no encontrado.");
  }

  const normalized = normalizeProductInput(input, { partial: true });

  if (normalized.categoryId) {
    await ensureCategoryExists(normalized.categoryId);
  }

  let uploadedImages: ProductImageUploadResult[] = [];

  if (images.length > 0) {
    uploadedImages = await uploadProductImages(images);
  }

  const updatedAt = new Date();
  const nextData = {
    ...normalized,
    ...(uploadedImages.length > 0
      ? {
          imageUrl: uploadedImages[0]?.imageUrl || null,
          imagePath: uploadedImages[0]?.imagePath || null,
          imageUrls: uploadedImages.map((image) => image.imageUrl),
          imagePaths: uploadedImages.map((image) => image.imagePath),
        }
      : {}),
    updatedAt,
  };

  await db.collection("products").doc(id).update(nextData);

  if (uploadedImages.length > 0) {
    await deleteProductImages(existing.imagePaths);
  }

  return serializeProduct({
    ...existing,
    ...nextData,
  });
}

export async function deleteProduct(id: string): Promise<DeleteResponse> {
  const db = getFirebaseAdminDb();
  const existing = await getProductDocById(id);

  if (!existing) {
    throw createHttpError(404, "Producto no encontrado.");
  }

  await db.collection("products").doc(id).delete();

  if (existing.imagePaths.length > 0) {
    await deleteProductImages(existing.imagePaths);
  }

  return { deleted: true };
}

export async function getProductStockById(
  id: string
): Promise<{ stock: number } | null> {
  const product = await getProductDocById(id);

  if (!product) {
    return null;
  }

  return {
    stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0,
  };
}

export async function getProductsByTag(tag: string): Promise<Product[]> {
  const normalizedTag = normalizeText(tag);
  const products = sortByCreatedAtDesc(await readProductsRaw());

  return products
    .filter((product) => normalizeText(product.tag) === normalizedTag)
    .map(serializeProduct);
}
