import type {
  Category,
  FirebaseDateLike,
  Product,
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
    imagen: product.imageUrl || null,
    image_url: product.imageUrl || null,
    image_path: product.imagePath || null,
    created_at: toIsoString(product.createdAt),
    updated_at: toIsoString(product.updatedAt),
  };
}
