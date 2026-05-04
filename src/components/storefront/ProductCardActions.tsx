"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import type { Product } from "@/types/domain";
import { getProductVariants, getVariantStock } from "@/lib/storefront";

interface ProductCardActionsProps {
  product: Product;
}

export function ProductCardActions({ product }: ProductCardActionsProps) {
  const [selectedMeasure, setSelectedMeasure] = useState("");
  const hasMeasures = product.medidas.length > 0;
  const measureLabel = product.medidas.length > 1 ? "Talles" : "Talle";
  const variants = getProductVariants(product);

  if (hasMeasures) {
    return (
      <div className="space-y-3">
        <div className="min-h-[74px] space-y-2 text-left sm:flex sm:min-h-[34px] sm:items-center sm:gap-3 sm:space-y-0">
          <p className="shrink-0 text-[11px] text-zinc-500 sm:text-xs">{measureLabel}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={measureLabel}>
            {variants.map((variant) => (
              <button
                key={variant.medida}
                type="button"
                role="radio"
                aria-checked={selectedMeasure === variant.medida}
                onClick={() => setSelectedMeasure(variant.medida)}
                disabled={variant.stock <= 0}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${selectedMeasure === variant.medida
                  ? "border-black bg-black text-white"
                  : variant.stock <= 0
                    ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                    : "border-zinc-300 bg-white text-black hover:border-black"
                  }`}
              >
                {variant.medida}
              </button>
            ))}
          </div>
        </div>

        <AddToCartButton
          key={selectedMeasure || "sin-talle"}
          productId={product.id_producto}
          stock={getVariantStock(product, selectedMeasure || null)}
          selectedMeasure={selectedMeasure || null}
          requiresMeasure
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div aria-hidden="true" className="h-[74px] sm:h-[34px]" />
      <AddToCartButton
        productId={product.id_producto}
        stock={product.stock}
        className="w-full"
      />
    </div>
  );
}
