"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { useStoreCart } from "@/components/storefront/StoreCartProvider";
import { formatCurrency } from "@/lib/storefront";
import { Button } from "@/components/ui/button";

export function StoreHeader() {
  const { itemCount, totalAmount, openDrawer } = useStoreCart();
  const cartButtonRef = useRef<HTMLSpanElement | null>(null);
  const [showFloatingCartButton, setShowFloatingCartButton] = useState(false);

  useEffect(() => {
    const target = cartButtonRef.current;

    if (!target) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingCartButton(!entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-black">
            Primera Collection
          </Link>
          <nav className="flex items-center gap-3 text-sm text-zinc-600">
            <Link href="/" className="transition hover:text-black">
              Inicio
            </Link>
            <span ref={cartButtonRef}>
              <Button
                type="button"
                variant="outline"
                className="relative rounded-full border-zinc-300 px-3"
                onClick={openDrawer}
              >
                <ShoppingBag />
                <span className="text-sm font-medium text-black">
                  {formatCurrency(totalAmount)}
                </span>
                <span className="absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-black px-1.5 py-0.5 text-[11px] font-medium text-white">
                  {itemCount}
                </span>
                <span className="sr-only">Abrir carrito</span>
              </Button>
            </span>
          </nav>
        </div>
      </header>

      <div
        className={`fixed right-4 bottom-4 z-30 transition-all duration-300 sm:right-6 sm:bottom-6 ${
          showFloatingCartButton
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <Button
          type="button"
          size="icon"
          className="relative size-12 rounded-full shadow-[0_16px_36px_rgba(0,0,0,0.14)]"
          onClick={openDrawer}
        >
          <ShoppingBag />
          <span className="absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[11px] font-medium text-black ring-1 ring-zinc-200">
            {itemCount}
          </span>
          <span className="sr-only">Abrir carrito</span>
        </Button>
      </div>

      <CartDrawer />
    </>
  );
}
