import type { Category, Product, ProductSearchResult } from "@/types/domain";
import { isRecord } from "@/types/shared";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isProductVariant(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.medida) &&
    typeof value.stock === "number" &&
    (value.sku === undefined || isNullableString(value.sku))
  );
}

function isProductVariantArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => isProductVariant(item));
}

export function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.id_categoria) &&
    isString(value.nombre_categoria) &&
    isString(value.slug) &&
    isNullableString(value.created_at)
  );
}

export function isCategoryArray(value: unknown): value is Category[] {
  return Array.isArray(value) && value.every((item) => isCategory(item));
}

export function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.id_producto) &&
    isString(value.nombre) &&
    isString(value.descripcion) &&
    typeof value.precio === "number" &&
    isNullableString(value.id_categoria) &&
    typeof value.stock === "number" &&
    isStringArray(value.medidas) &&
    isProductVariantArray(value.variantes) &&
    isNullableString(value.imagen) &&
    isStringArray(value.imagenes) &&
    (value.image_path === undefined || isNullableString(value.image_path)) &&
    (value.image_paths === undefined || isStringArray(value.image_paths))
  );
}

export function isProductArray(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every((item) => isProduct(item));
}

export function isProductSearchResult(value: unknown): value is ProductSearchResult {
  return (
    isRecord(value) &&
    isString(value.id_producto) &&
    isString(value.nombre) &&
    isString(value.descripcion) &&
    typeof value.precio === "number" &&
    isNullableString(value.id_categoria) &&
    typeof value.stock === "number" &&
    isStringArray(value.medidas) &&
    isProductVariantArray(value.variantes) &&
    isNullableString(value.imagen) &&
    isStringArray(value.imagenes)
  );
}

export function isProductSearchResultArray(value: unknown): value is ProductSearchResult[] {
  return Array.isArray(value) && value.every((item) => isProductSearchResult(item));
}

export function isAdminCatalogPayload(
  value: unknown
): value is { categories: Category[]; products: Product[] } {
  return (
    isRecord(value) &&
    isCategoryArray(value.categories) &&
    isProductArray(value.products)
  );
}
