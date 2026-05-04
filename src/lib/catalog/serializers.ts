import type {
  Category,
  FirebaseDateLike,
  Product,
  ProductSearchResult,
  ProductVariant,
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

function resolveCommercialPrice(product: RawProductRecord): {
  basePrice: number;
  effectivePrice: number;
  promoPrice: number | null;
  hasPromotion: boolean;
} {
  const fallbackBasePrice = parseNumber(product.price, 0) ?? 0;
  const basePrice = parseNumber(product.basePrice, fallbackBasePrice) ?? fallbackBasePrice;
  const promoPrice = parseNumber(product.promoPrice, null);
  const promoEnabled = product.promoEnabled === true;
  const hasPromotion = Boolean(
    promoEnabled && promoPrice !== null && promoPrice >= 0 && promoPrice < basePrice
  );

  return {
    basePrice,
    effectivePrice: hasPromotion ? promoPrice ?? basePrice : basePrice,
    promoPrice: hasPromotion ? promoPrice : null,
    hasPromotion,
  };
}

function serializeProductVariants(product: RawProductRecord): ProductVariant[] {
  if (!Array.isArray(product.variants)) {
    return [];
  }

  const seenMeasures = new Set<string>();

  return product.variants
    .map((variant) => ({
      medida: typeof variant?.medida === "string" ? variant.medida.trim() : "",
      stock: parseNumber(variant?.stock, 0) ?? 0,
      sku:
        typeof variant?.sku === "string" && variant.sku.trim()
          ? variant.sku.trim()
          : null,
    }))
    .filter((variant) => {
      if (!variant.medida) {
        return false;
      }

      const normalizedMeasure = variant.medida.toLowerCase();

      if (seenMeasures.has(normalizedMeasure)) {
        return false;
      }

      seenMeasures.add(normalizedMeasure);
      return true;
    });
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
  const pricing = resolveCommercialPrice(product);
  const variants = serializeProductVariants(product);
  const measureOptions = Array.isArray(product.measureOptions) ? product.measureOptions : [];
  const measures = variants.length > 0 ? variants.map((variant) => variant.medida) : measureOptions;
  const stock =
    variants.length > 0
      ? variants.reduce((total, variant) => total + variant.stock, 0)
      : parseNumber(product.stock, 0) ?? 0;

  return {
    id: product.id,
    id_producto: product.id,
    nombre: product.name || "",
    descripcion: product.description || "",
    precio: pricing.effectivePrice,
    precio_lista: pricing.basePrice,
    precio_promocional: pricing.promoPrice,
    tiene_promocion: pricing.hasPromotion,
    id_categoria: product.categoryId || null,
    stock,
    tag: product.tag || null,
    tipo_medida: product.measureType || "none",
    medidas: measures,
    variantes: variants,
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
    precio_lista: product.precio_lista,
    precio_promocional: product.precio_promocional,
    tiene_promocion: product.tiene_promocion,
    id_categoria: product.id_categoria,
    stock: product.stock,
    medidas: product.medidas,
    variantes: product.variantes,
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
