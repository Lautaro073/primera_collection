import type { Category, Product } from "@/types/domain";

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
