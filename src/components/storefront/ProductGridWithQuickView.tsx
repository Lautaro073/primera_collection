"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/types/domain";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductQuickViewDialog } from "@/components/storefront/ProductQuickViewDialog";

interface ProductGridWithQuickViewProps {
  products: Product[];
  categoryNameById?: Record<string, string>;
  fallbackCategoryName?: string;
  columnsClassName?: string;
}

export function ProductGridWithQuickView({
  products,
  categoryNameById,
  fallbackCategoryName,
  columnsClassName = "grid gap-5 sm:grid-cols-2 xl:grid-cols-4",
}: ProductGridWithQuickViewProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const selectedProduct = useMemo(
    () => products.find((product) => product.id_producto === selectedProductId) || null,
    [products, selectedProductId]
  );

  return (
    <>
      <div className={columnsClassName}>
        {products.map((product) => (
          <ProductCard
            key={product.id_producto}
            product={product}
            categoryName={
              fallbackCategoryName ||
              (product.id_categoria ? categoryNameById?.[product.id_categoria] : undefined)
            }
            onSelect={() => setSelectedProductId(product.id_producto)}
          />
        ))}
      </div>

      <ProductQuickViewDialog
        key={selectedProduct?.id_producto || "quick-view-empty"}
        product={selectedProduct}
        categoryName={
          selectedProduct
            ? fallbackCategoryName ||
              (selectedProduct.id_categoria
                ? categoryNameById?.[selectedProduct.id_categoria]
                : undefined)
            : undefined
        }
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProductId("");
          }
        }}
      />
    </>
  );
}
