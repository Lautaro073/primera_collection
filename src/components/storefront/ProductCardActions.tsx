"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import type { Product } from "@/types/domain";

interface ProductCardActionsProps {
  product: Product;
}

export function ProductCardActions({ product }: ProductCardActionsProps) {
  const [selectedMeasure, setSelectedMeasure] = useState("");
  const hasMeasures = product.medidas.length > 0;
  const measureLabel = product.medidas.length > 1 ? "Talles" : "Talle";

  if (hasMeasures) {
    return (
      <div className="space-y-3">
        <div className="min-h-[74px] space-y-2 text-left sm:flex sm:min-h-[34px] sm:items-center sm:gap-3 sm:space-y-0">
          <p className="shrink-0 text-[11px] text-zinc-500 sm:text-xs">{measureLabel}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={measureLabel}>
            {product.medidas.map((measure) => (
              <button
                key={measure}
                type="button"
                role="radio"
                aria-checked={selectedMeasure === measure}
                onClick={() => setSelectedMeasure(measure)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${selectedMeasure === measure
                  ? "border-black bg-black text-white"
                  : "border-zinc-300 bg-white text-black hover:border-black"
                  }`}
              >
                {measure}
              </button>
            ))}
          </div>
        </div>

        <AddToCartButton
          key={selectedMeasure || "sin-talle"}
          productId={product.id_producto}
          stock={product.stock}
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
