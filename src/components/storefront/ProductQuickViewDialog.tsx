/* eslint-disable @next/next/no-img-element */

"use client";

import { useState } from "react";
import type { Product } from "@/types/domain";
import { formatCurrency } from "@/lib/storefront";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductQuickViewDialogProps {
  product: Product | null;
  categoryName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductQuickViewDialog({
  product,
  categoryName,
  open,
  onOpenChange,
}: ProductQuickViewDialogProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = product?.imagenes.length ? product.imagenes : product?.imagen ? [product.imagen] : [];
  const activeImage = images[activeImageIndex] || images[0] || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 sm:max-w-4xl">
        {product ? (
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border-b border-zinc-200 bg-zinc-100 p-4 lg:border-b-0 lg:border-r">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.nombre}
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center bg-[linear-gradient(135deg,#f5f5f5,#e5e5e5)] text-xs uppercase tracking-[0.25em] text-zinc-500">
                    Sin imagen
                  </div>
                )}
              </div>

              {images.length > 1 ? (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`overflow-hidden rounded-xl border ${index === activeImageIndex ? "border-black" : "border-zinc-200"}`}
                    >
                      <img
                        src={image}
                        alt={`${product.nombre} ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-6 p-6">
              <DialogHeader className="space-y-3">
                {categoryName ? (
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
                    {categoryName}
                  </p>
                ) : null}
                <DialogTitle className="text-3xl tracking-tight">{product.nombre}</DialogTitle>
                <DialogDescription className="text-base font-semibold text-black">
                  {formatCurrency(product.precio)}
                </DialogDescription>
              </DialogHeader>

              <p className="text-sm leading-7 text-zinc-600">
                {product.descripcion || "Sin descripcion disponible."}
              </p>

              <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-zinc-500">Stock</span>
                  <span className="font-medium text-black">
                    {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-zinc-500">
                    {product.tipo_medida === "calzado" ? "Numeros" : "Talles"}
                  </span>
                  <span className="text-right font-medium text-black">
                    {product.medidas.length > 0 ? product.medidas.join(", ") : "No aplica"}
                  </span>
                </div>
                {product.tag ? (
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-zinc-500">Etiqueta</span>
                    <span className="font-medium text-black">{product.tag}</span>
                  </div>
                ) : null}
              </div>

              <Button type="button" onClick={() => onOpenChange(false)}>
                Cerrar detalle
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
