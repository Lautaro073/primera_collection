"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import type { Product } from "@/types/domain";
import { getProductVariants, getVariantStock } from "@/lib/storefront";

interface ProductPurchasePanelProps {
  product: Product;
  className?: string;
}

export function ProductPurchasePanel({
  product,
  className,
}: ProductPurchasePanelProps) {
  const [selectedMeasure, setSelectedMeasure] = useState("");
  const hasMeasures = product.medidas.length > 0;
  const variants = getProductVariants(product);

  return (
    <div className="space-y-4">
      {hasMeasures ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-black">Elige tu talle</p>
            <p className="text-sm text-zinc-500">
              Selecciona un talle antes de agregar al carrito.
            </p>
          </div>

          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Elige tu talle">
            {variants.map((variant) => (
              <button
                key={variant.medida}
                type="button"
                role="radio"
                aria-checked={selectedMeasure === variant.medida}
                onClick={() => setSelectedMeasure(variant.medida)}
                disabled={variant.stock <= 0}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selectedMeasure === variant.medida
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
      ) : null}

        <AddToCartButton
          key={selectedMeasure || "sin-talle"}
          productId={product.id_producto}
          stock={getVariantStock(product, selectedMeasure || null)}
          selectedMeasure={selectedMeasure || null}
          requiresMeasure={hasMeasures}
          className={className}
      />
    </div>
  );
}
