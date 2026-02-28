"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import type { Product } from "@/types/domain";

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

          <div className="flex flex-wrap gap-2">
            {product.medidas.map((measure) => (
              <button
                key={measure}
                type="button"
                onClick={() => setSelectedMeasure(measure)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selectedMeasure === measure
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 bg-white text-black hover:border-black"
                }`}
              >
                {measure}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <AddToCartButton
        key={selectedMeasure || "sin-talle"}
        productId={product.id_producto}
        stock={product.stock}
        selectedMeasure={selectedMeasure || null}
        requiresMeasure={hasMeasures}
        className={className}
      />
    </div>
  );
}
