"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { useStoreCart } from "@/components/storefront/StoreCartProvider";
import { Button } from "@/components/ui/button";

export function StoreHeader() {
  const { itemCount, openDrawer } = useStoreCart();

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
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-zinc-300 px-3"
              onClick={openDrawer}
            >
              <ShoppingBag />
              Carrito
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-black px-1.5 py-0.5 text-[11px] font-medium text-white">
                {itemCount}
              </span>
            </Button>
          </nav>
        </div>
      </header>

      <CartDrawer />
    </>
  );
}
