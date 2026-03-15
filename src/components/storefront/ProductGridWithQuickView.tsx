"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types/domain";
import { ProductCard } from "@/components/storefront/ProductCard";
import { cn } from "@/lib/utils";

const ProductQuickViewDialog = dynamic(
  () =>
    import("@/components/storefront/ProductQuickViewDialog").then(
      (module) => module.ProductQuickViewDialog
    ),
  { ssr: false }
);

interface ProductGridWithQuickViewProps {
  products: Product[];
  categoryNameById?: Record<string, string>;
  fallbackCategoryName?: string;
  columnsClassName?: string;
}

export function ProductGridWithQuickView({
  products,
  categoryNameById,
  fallbackCategoryName,
  columnsClassName = "",
}: ProductGridWithQuickViewProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    momentumId: 0,
  });

  const selectedProduct = useMemo(
    () => products.find((product) => product.id_producto === selectedProductId) || null,
    [products, selectedProductId]
  );

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    function updateScrollState(): void {
      const currentCarousel = carouselRef.current;

      if (!currentCarousel) {
        return;
      }

      const maxScrollLeft = currentCarousel.scrollWidth - currentCarousel.clientWidth;
      setCanScrollLeft(currentCarousel.scrollLeft > 8);
      setCanScrollRight(maxScrollLeft - currentCarousel.scrollLeft > 8);
    }

    updateScrollState();
    carousel.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      carousel.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [products]);

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    function stopMomentum(): void {
      if (dragRef.current.momentumId) {
        cancelAnimationFrame(dragRef.current.momentumId);
        dragRef.current.momentumId = 0;
      }
    }

    function applyMomentum(): void {
      const el = carouselRef.current;
      const d = dragRef.current;

      if (!el || Math.abs(d.velocity) < 0.3) {
        d.momentumId = 0;
        return;
      }

      el.scrollLeft += d.velocity;
      d.velocity *= 0.95; // friction — lower = stops faster
      d.momentumId = requestAnimationFrame(applyMomentum);
    }

    function handleMouseDown(event: MouseEvent): void {
      const el = carouselRef.current;
      if (!el) return;
      stopMomentum();
      const now = performance.now();
      dragRef.current.isDown = true;
      dragRef.current.startX = event.pageX - el.offsetLeft;
      dragRef.current.scrollLeft = el.scrollLeft;
      dragRef.current.lastX = event.pageX;
      dragRef.current.lastTime = now;
      dragRef.current.velocity = 0;
      setIsDragging(false);
    }

    function handleMouseLeave(): void {
      if (!dragRef.current.isDown) return;
      dragRef.current.isDown = false;
      applyMomentum();
      window.setTimeout(() => setIsDragging(false), 0);
    }

    function handleMouseUp(): void {
      if (!dragRef.current.isDown) return;
      dragRef.current.isDown = false;
      applyMomentum();
      window.setTimeout(() => setIsDragging(false), 0);
    }

    function handleMouseMove(event: MouseEvent): void {
      const el = carouselRef.current;
      const d = dragRef.current;
      if (!el || !d.isDown) return;
      event.preventDefault();

      const x = event.pageX - el.offsetLeft;
      const walk = x - d.startX;
      if (Math.abs(walk) > 3) {
        setIsDragging(true);
      }

      // Track velocity from recent movement
      const now = performance.now();
      const dt = now - d.lastTime;
      if (dt > 0) {
        const dx = event.pageX - d.lastX;
        // Blend with previous velocity for smoother result
        d.velocity = d.velocity * 0.4 + ((-dx / dt) * 16) * 0.6;
      }
      d.lastX = event.pageX;
      d.lastTime = now;

      el.scrollLeft = d.scrollLeft - walk;
    }

    carousel.addEventListener("mousedown", handleMouseDown);
    carousel.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseup", handleMouseUp);
    carousel.addEventListener("mousemove", handleMouseMove);

    return () => {
      stopMomentum();
      carousel.removeEventListener("mousedown", handleMouseDown);
      carousel.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseup", handleMouseUp);
      carousel.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  function scrollCarousel(direction: "left" | "right"): void {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    const amount = Math.max(carousel.clientWidth * 0.82, 220);
    carousel.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <>
      <div className="relative">
        <div
          ref={carouselRef}
          className={cn(
            "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 md:mx-0 md:px-0",
            isDragging ? "cursor-grabbing **:pointer-events-none" : "cursor-grab",
            columnsClassName
          )}
        >
          {products.map((product) => (
            <div
              key={product.id_producto}
              className="w-[14.5rem] shrink-0 snap-start sm:w-[15.5rem] lg:w-[17rem] xl:w-[18rem]"
            >
              <ProductCard
                product={product}
                categoryName={
                  fallbackCategoryName ||
                  (product.id_categoria ? categoryNameById?.[product.id_categoria] : undefined)
                }
                onSelect={() => setSelectedProductId(product.id_producto)}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollCarousel("left")}
          className={cn(
            "absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/40 bg-white/55 p-2 text-black/70 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm transition hover:bg-white/75 hover:text-black sm:flex",
            canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <ChevronLeft className="size-5" />
          <span className="sr-only">Ver productos anteriores</span>
        </button>

        <button
          type="button"
          onClick={() => scrollCarousel("right")}
          className={cn(
            "absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/40 bg-white/55 p-2 text-black/70 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm transition hover:bg-white/75 hover:text-black sm:flex",
            canScrollRight ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <ChevronRight className="size-5" />
          <span className="sr-only">Ver mas productos</span>
        </button>
      </div>

      {selectedProduct ? (
        <ProductQuickViewDialog
          key={selectedProduct.id_producto}
          product={selectedProduct}
          categoryName={
            fallbackCategoryName ||
            (selectedProduct.id_categoria
              ? categoryNameById?.[selectedProduct.id_categoria]
              : undefined)
          }
          open={Boolean(selectedProduct)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProductId("");
            }
          }}
        />
      ) : null}
    </>
  );
}

