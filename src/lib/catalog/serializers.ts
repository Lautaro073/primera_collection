import type {
  Category,
  FirebaseDateLike,
  Product,
  ProductSearchResult,
  RawCategoryRecord,
  RawProductRecord,
} from "@/types/domain";

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

function parseNumber(
  value: number | string | null | undefined,
  fallback: number | null = null
): number | null {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? fallback : numericValue;
}

export function serializeCategory(category: RawCategoryRecord): Category {
  return {
    id: category.id,
    id_categoria: category.id,
    nombre_categoria: category.name || "",
    slug: category.slug || "",
    created_at: toIsoString(category.createdAt),
  };
}

export function serializeProduct(product: RawProductRecord): Product {
  return {
    id: product.id,
    id_producto: product.id,
    nombre: product.name || "",
    descripcion: product.description || "",
    precio: parseNumber(product.price, 0) ?? 0,
    id_categoria: product.categoryId || null,
    stock: parseNumber(product.stock, 0) ?? 0,
    tag: product.tag || null,
    tipo_medida: product.measureType || "none",
    medidas: Array.isArray(product.measureOptions) ? product.measureOptions : [],
    imagen: product.imageUrl || null,
    imagenes: Array.isArray(product.imageUrls) ? product.imageUrls : [],
    image_url: product.imageUrl || null,
    image_urls: Array.isArray(product.imageUrls) ? product.imageUrls : [],
    image_path: product.imagePath || null,
    image_paths: Array.isArray(product.imagePaths) ? product.imagePaths : [],
    created_at: toIsoString(product.createdAt),
    updated_at: toIsoString(product.updatedAt),
  };
}

export function stripInternalProductFields(product: Product): Product {
  const { image_path, image_paths, image_url, image_urls, ...publicFields } = product;
  return publicFields;
}

export function serializeProductSearchResult(product: Product): ProductSearchResult {
  return {
    id_producto: product.id_producto,
    nombre: product.nombre,
    descripcion: product.descripcion,
    precio: product.precio,
    id_categoria: product.id_categoria,
    stock: product.stock,
    medidas: product.medidas,
    imagen: product.imagen,
    imagenes: product.imagenes,
  };
}

export function stripInternalCategoryProducts(category: {
  productos: Product[];
}): { productos: Product[] } {
  return {
    productos: category.productos.map(stripInternalProductFields),
  };
}
