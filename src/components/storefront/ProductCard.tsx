"use client";

/* eslint-disable @next/next/no-img-element */

import type { Product } from "@/types/domain";
import { formatCurrency } from "@/lib/storefront";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  onSelect?: (product: Product) => void;
}

export function ProductCard({ product, categoryName, onSelect }: ProductCardProps) {
  const cardBody = (
    <>
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
          {product.medidas.length > 0 ? (
            <p className="text-xs text-zinc-500">
              {product.tipo_medida === "calzado" ? "Numeros" : "Talles"}: {product.medidas.join(", ")}
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

        {product.tag ? (
          <div className="border-t border-zinc-100 pt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
            {product.tag}
          </div>
        ) : null}
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left transition hover:border-zinc-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.05)]"
      >
        {cardBody}
      </button>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.05)]">
      {cardBody}
    </article>
  );
}
