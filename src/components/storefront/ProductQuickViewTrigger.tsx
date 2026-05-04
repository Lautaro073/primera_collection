"use client";

import type { ReactNode } from "react";
import type { Product } from "@/types/domain";
import { useProductGridQuickView } from "@/components/storefront/ProductGridCarouselClient";

interface ProductQuickViewTriggerProps {
  children: ReactNode;
  className?: string;
  categoryName?: string;
  product: Product;
}

export function ProductQuickViewTrigger({
  children,
  className,
  categoryName,
  product,
}: ProductQuickViewTriggerProps) {
  const { openProduct } = useProductGridQuickView();

  return (
    <button
      type="button"
      onClick={() => openProduct(product, categoryName)}
      className={className}
    >
      {children}
    </button>
  );
}
