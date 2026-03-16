"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types/domain";
import { cn } from "@/lib/utils";

const ProductQuickViewDialog = dynamic(
  () =>
    import("@/components/storefront/ProductQuickViewDialog").then(
      (module) => module.ProductQuickViewDialog
    ),
  { ssr: false }
);

interface ProductGridQuickViewContextValue {
  openProduct: (product: Product, categoryName?: string) => void;
}

interface ActiveProductState {
  categoryName?: string;
  product: Product;
}

interface ProductGridCarouselClientProps {
  children: ReactNode;
  columnsClassName?: string;
}

const ProductGridQuickViewContext = createContext<ProductGridQuickViewContextValue | null>(null);

export function ProductGridCarouselClient({
  children,
  columnsClassName = "",
}: ProductGridCarouselClientProps) {
  const [activeProduct, setActiveProduct] = useState<ActiveProductState | null>(null);
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

  const contextValue = useMemo<ProductGridQuickViewContextValue>(
    () => ({
      openProduct: (product, categoryName) => {
        setActiveProduct({ product, categoryName });
      },
    }),
    []
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
  }, []);

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
      const element = carouselRef.current;
      const dragState = dragRef.current;

      if (!element || Math.abs(dragState.velocity) < 0.3) {
        dragState.momentumId = 0;
        return;
      }

      element.scrollLeft += dragState.velocity;
      dragState.velocity *= 0.95;
      dragState.momentumId = requestAnimationFrame(applyMomentum);
    }

    function handleMouseDown(event: MouseEvent): void {
      const element = carouselRef.current;

      if (!element) {
        return;
      }

      stopMomentum();
      const now = performance.now();
      dragRef.current.isDown = true;
      dragRef.current.startX = event.pageX - element.offsetLeft;
      dragRef.current.scrollLeft = element.scrollLeft;
      dragRef.current.lastX = event.pageX;
      dragRef.current.lastTime = now;
      dragRef.current.velocity = 0;
      setIsDragging(false);
    }

    function handleMouseLeave(): void {
      if (!dragRef.current.isDown) {
        return;
      }

      dragRef.current.isDown = false;
      applyMomentum();
      window.setTimeout(() => setIsDragging(false), 0);
    }

    function handleMouseUp(): void {
      if (!dragRef.current.isDown) {
        return;
      }

      dragRef.current.isDown = false;
      applyMomentum();
      window.setTimeout(() => setIsDragging(false), 0);
    }

    function handleMouseMove(event: MouseEvent): void {
      const element = carouselRef.current;
      const dragState = dragRef.current;

      if (!element || !dragState.isDown) {
        return;
      }

      event.preventDefault();

      const x = event.pageX - element.offsetLeft;
      const walk = x - dragState.startX;

      if (Math.abs(walk) > 3) {
        setIsDragging(true);
      }

      const now = performance.now();
      const dt = now - dragState.lastTime;

      if (dt > 0) {
        const dx = event.pageX - dragState.lastX;
        dragState.velocity = dragState.velocity * 0.4 + ((-dx / dt) * 16) * 0.6;
      }

      dragState.lastX = event.pageX;
      dragState.lastTime = now;
      element.scrollLeft = dragState.scrollLeft - walk;
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
    <ProductGridQuickViewContext.Provider value={contextValue}>
      <div className="relative">
        <div
          ref={carouselRef}
          className={cn(
            "flex snap-x snap-mandatory gap-4 overflow-x-auto pl-4 pr-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:pl-6 sm:pr-6 md:pl-0 md:pr-0",
            isDragging ? "cursor-grabbing **:pointer-events-none" : "cursor-grab",
            columnsClassName
          )}
        >
          {children}
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

      {activeProduct ? (
        <ProductQuickViewDialog
          key={activeProduct.product.id_producto}
          product={activeProduct.product}
          categoryName={activeProduct.categoryName}
          open={Boolean(activeProduct)}
          onOpenChange={(open) => {
            if (!open) {
              setActiveProduct(null);
            }
          }}
        />
      ) : null}
    </ProductGridQuickViewContext.Provider>
  );
}

export function useProductGridQuickView(): ProductGridQuickViewContextValue {
  const context = useContext(ProductGridQuickViewContext);

  if (!context) {
    throw new Error("useProductGridQuickView debe usarse dentro de ProductGridCarouselClient.");
  }

  return context;
}
