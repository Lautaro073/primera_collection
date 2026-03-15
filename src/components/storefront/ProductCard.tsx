"use client";

import Image from "next/image";
import { useState } from "react";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import type { Product } from "@/types/domain";
import { isCloudinaryImageUrl, storefrontImageLoader } from "@/lib/images";
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
  const imageLoader = isCloudinaryImageUrl(product.imagen)
    ? storefrontImageLoader
    : undefined;

  const details = (
    <div className="space-y-3 p-3 text-left sm:p-4">
      <div className="space-y-1">
        {categoryName ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">
            {categoryName}
          </p>
        ) : null}
        <h3 className="text-sm font-medium text-black sm:text-base">{product.nombre}</h3>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-sm font-semibold text-black sm:text-base">
            {formatCurrency(product.precio)}
          </span>
          <p className="text-[10px] leading-tight text-zinc-500">Precio de contado/efectivo*</p>
        </div>
        <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 sm:text-xs">
          {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
        </span>
      </div>
    </div>
  );

  const media = (
    <div className="relative aspect-[4/4.2] overflow-hidden bg-zinc-100 sm:aspect-[4/4.4] lg:aspect-[4/3.9]">
      {product.imagen ? (
        <Image
          src={product.imagen}
          alt={product.nombre}
          fill
          loader={imageLoader}
          sizes="(max-width: 639px) 58vw, (max-width: 1023px) 32vw, (max-width: 1279px) 18rem, 18rem"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#f5f5f5,#e5e5e5)] text-[10px] uppercase tracking-[0.25em] text-zinc-500 sm:text-xs">
          Sin imagen
        </div>
      )}
    </div>
  );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.05)]">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(product)}
          className="block w-full text-left"
        >
          {media}
          {details}
        </button>
      ) : (
        <div>
          {media}
          {details}
        </div>
      )}

      <div className="mt-auto space-y-3 px-3 pb-3 sm:px-4 sm:pb-4">
        {hasMeasures ? (
          <div className="space-y-3">
            <div className="min-h-[74px] space-y-2 text-left sm:flex sm:min-h-[34px] sm:items-center sm:gap-3 sm:space-y-0">
              <p className="shrink-0 text-[11px] text-zinc-500 sm:text-xs">{measureLabel}</p>
              <div className="flex flex-wrap gap-2">
                {product.medidas.map((measure) => (
                  <button
                    key={measure}
                    type="button"
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
        ) : (
          <div className="space-y-3">
            <div aria-hidden="true" className="h-[74px] sm:h-[34px]" />
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


