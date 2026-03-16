import type { Category, Product, ProductSearchResult, ProductVariant } from "@/types/domain";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getCategoryHref(category: Pick<Category, "slug" | "nombre_categoria">): string {
  const segment = category.slug || category.nombre_categoria;
  return `/categoria/${encodeURIComponent(segment)}`;
}

export function getProductHref(product: Pick<Product, "id_producto">): string {
  return `/producto/${encodeURIComponent(product.id_producto)}`;
}

type ProductWithVariants = Pick<Product, "medidas" | "variantes" | "stock"> | Pick<ProductSearchResult, "medidas" | "variantes" | "stock">;

export function getProductVariants(product: ProductWithVariants): ProductVariant[] {
  if (product.variantes.length > 0) {
    return product.variantes;
  }

  return product.medidas.map((medida) => ({
    medida,
    stock: product.stock,
    sku: null,
  }));
}

export function getVariantStock(
  product: ProductWithVariants,
  selectedMeasure: string | null | undefined
): number {
  if (!selectedMeasure) {
    return product.stock;
  }

  const variant = getProductVariants(product).find((item) => item.medida === selectedMeasure);
  return variant ? variant.stock : 0;
}
