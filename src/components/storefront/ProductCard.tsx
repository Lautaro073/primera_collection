"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import type { Product } from "@/types/domain";
import { formatCurrency } from "@/lib/storefront";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  onSelect?: (product: Product) => void;
}

export function ProductCard({ product, categoryName, onSelect }: ProductCardProps) {
  const [selectedMeasure, setSelectedMeasure] = useState("");
  const hasMeasures = product.medidas.length > 0;
  const measureLabel = product.medidas.length > 1 ? "Talles" : "Talle";

  const details = (
    <div className="space-y-3 p-4 text-left">
      <div className="space-y-1">
        {categoryName ? (
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            {categoryName}
          </p>
        ) : null}
        <h3 className="text-base font-medium text-black">{product.nombre}</h3>
        {product.descripcion ? (
          <p className="line-clamp-2 text-sm leading-6 text-zinc-600">
            {product.descripcion}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold text-black">
          {formatCurrency(product.precio)}
        </span>
        <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
        </span>
      </div>
    </div>
  );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.05)]">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(product)}
          className="block w-full flex-1 text-left"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
            {product.imagen ? (
              <img
                src={product.imagen}
                alt={product.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f5f5f5,#e5e5e5)] text-xs uppercase tracking-[0.25em] text-zinc-500">
                Sin imagen
              </div>
            )}
          </div>
          {details}
        </button>
      ) : (
        <div className="flex-1">
          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
            {product.imagen ? (
              <img
                src={product.imagen}
                alt={product.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f5f5f5,#e5e5e5)] text-xs uppercase tracking-[0.25em] text-zinc-500">
                Sin imagen
              </div>
            )}
          </div>
          {details}
        </div>
      )}

      <div className="mt-auto space-y-3 px-4 pb-4">
        {hasMeasures ? (
          <div className="space-y-3">
            <div className="space-y-2 text-left md:flex md:items-center md:gap-3 md:space-y-0">
              <p className="shrink-0 text-xs text-zinc-500">{measureLabel}</p>
              <div className="flex flex-wrap gap-2">
                {product.medidas.map((measure) => (
                  <button
                    key={measure}
                    type="button"
                    onClick={() => setSelectedMeasure(measure)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
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

            <AddToCartButton
              key={selectedMeasure || "sin-talle"}
              productId={product.id_producto}
              stock={product.stock}
              selectedMeasure={selectedMeasure || null}
              requiresMeasure
              className="w-full"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div aria-hidden="true" className="h-[34px]" />
            <AddToCartButton
              productId={product.id_producto}
              stock={product.stock}
              className="w-full"
            />
          </div>
        )}
      </div>
    </article>
  );
}
