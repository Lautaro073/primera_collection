/* eslint-disable @next/next/no-img-element */

"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMeasure, setSelectedMeasure] = useState("");
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const images = product?.imagenes.length ? product.imagenes : product?.imagen ? [product.imagen] : [];
  const activeImage = images[activeImageIndex] || images[0] || null;

  function clampOffset(
    nextX: number,
    nextY: number,
    bounds: DOMRect
  ): { x: number; y: number } {
    const maxOffsetX = Math.max(0, ((bounds.width * zoomLevel) - bounds.width) / 2);
    const maxOffsetY = Math.max(0, ((bounds.height * zoomLevel) - bounds.height) / 2);

    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextX)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextY)),
    };
  }

  function resetView(): void {
    setZoomLevel(1);
    setImageOffset({ x: 0, y: 0 });
    setIsDragging(false);
    dragStateRef.current = null;
  }

  function zoomIn(): void {
    setZoomLevel((current) => Math.min(3, current + 0.5));
  }

  function zoomOut(): void {
    setZoomLevel((current) => {
      const nextZoom = Math.max(1, current - 0.5);

      if (nextZoom === 1) {
        setImageOffset({ x: 0, y: 0 });
      }

      return nextZoom;
    });
  }

  function resetZoom(): void {
    resetView();
  }

  function handleImagePointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (zoomLevel <= 1) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: imageOffset.x,
      originY: imageOffset.y,
      moved: false,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleImagePointerMove(event: PointerEvent<HTMLDivElement>): void {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId || zoomLevel <= 1) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragState.moved = true;
    }

    const nextOffset = clampOffset(
      dragState.originX + deltaX,
      dragState.originY + deltaY,
      event.currentTarget.getBoundingClientRect()
    );

    setImageOffset(nextOffset);
  }

  function handleImagePointerUp(event: PointerEvent<HTMLDivElement>): void {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);

    if (!dragState.moved && zoomLevel > 1) {
      resetView();
      return;
    }

    dragStateRef.current = null;
  }

  function handleImagePointerLeave(): void {
    if (!dragStateRef.current) {
      return;
    }

    setIsDragging(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 sm:max-w-4xl">
        {product ? (
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border-b border-zinc-200 bg-zinc-100 p-4 lg:border-b-0 lg:border-r">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
                Imagenes
              </p>

              <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                {activeImage ? (
                  <div
                    onPointerDown={handleImagePointerDown}
                    onPointerMove={handleImagePointerMove}
                    onPointerUp={handleImagePointerUp}
                    onPointerCancel={handleImagePointerUp}
                    onPointerLeave={handleImagePointerLeave}
                    onDragStart={(event) => event.preventDefault()}
                    onDoubleClick={() => {
                      if (zoomLevel > 1) {
                        resetView();
                        return;
                      }

                      setZoomLevel(2);
                      setImageOffset({ x: 0, y: 0 });
                    }}
                    className={
                      zoomLevel > 1
                        ? isDragging
                          ? "block w-full cursor-grabbing touch-none"
                          : "block w-full cursor-grab touch-none"
                        : "block w-full cursor-zoom-in"
                    }
                  >
                    <img
                      src={activeImage}
                      alt={product.nombre}
                      draggable={false}
                      className="aspect-[4/5] w-full object-cover transition-transform duration-300"
                      style={{
                        transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${zoomLevel})`,
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center bg-[linear-gradient(135deg,#f5f5f5,#e5e5e5)] text-xs uppercase tracking-[0.25em] text-zinc-500">
                    Sin imagen
                  </div>
                )}

                {activeImage ? (
                  <div
                    className={`absolute right-3 top-3 flex items-center gap-2 rounded-full border border-zinc-200 bg-white/92 p-1 shadow-sm backdrop-blur-sm transition-opacity duration-200 ${
                      zoomLevel > 1
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                    }`}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full"
                      onClick={zoomOut}
                      disabled={zoomLevel <= 1}
                    >
                      <Minus />
                      <span className="sr-only">Alejar</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full"
                      onClick={resetZoom}
                      disabled={zoomLevel === 1}
                    >
                      <RotateCcw />
                      <span className="sr-only">Restablecer zoom</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full"
                      onClick={zoomIn}
                      disabled={zoomLevel >= 3}
                    >
                      <Plus />
                      <span className="sr-only">Acercar</span>
                    </Button>
                  </div>
                ) : null}
              </div>

              {images.length > 1 ? (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => {
                        setActiveImageIndex(index);
                        resetView();
                      }}
                      className={`overflow-hidden rounded-xl border ${index === activeImageIndex ? "border-black" : "border-zinc-200"}`}
                    >
                      <img
                        src={image}
                        alt={`${product.nombre} ${index + 1}`}
                        draggable={false}
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
              </div>

              {product.medidas.length > 0 ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-black">Elige tu talle</p>
                    <p className="text-sm text-zinc-500">
                      Selecciona un talle antes de agregar.
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

              <div className="flex flex-col gap-3">
                <AddToCartButton
                  key={selectedMeasure || "sin-talle"}
                  productId={product.id_producto}
                  stock={product.stock}
                  selectedMeasure={selectedMeasure || null}
                  requiresMeasure={product.medidas.length > 0}
                  className="w-full"
                  onAdded={() => onOpenChange(false)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
