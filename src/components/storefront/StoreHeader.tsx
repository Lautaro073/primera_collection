"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Plus, Search, ShoppingBag, X } from "lucide-react";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { ProductQuickViewDialog } from "@/components/storefront/ProductQuickViewDialog";
import { useStoreCart } from "@/components/storefront/StoreCartProvider";
import type { Product } from "@/types/domain";
import { formatCurrency } from "@/lib/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function isProduct(value: unknown): value is Product {
  return (
    typeof value === "object" &&
    value !== null &&
    "id_producto" in value &&
    "nombre" in value &&
    "precio" in value
  );
}

function isProductArray(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every((item) => isProduct(item));
}

function getSearchError(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "No se pudo realizar la busqueda.";
}

export function StoreHeader() {
  const { addItem, itemCount, totalAmount, openDrawer } = useStoreCart();
  const cartButtonRef = useRef<HTMLSpanElement | null>(null);
  const desktopSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const [showFloatingCartButton, setShowFloatingCartButton] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    const target = cartButtonRef.current;

    if (!target || typeof IntersectionObserver === "undefined") {
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

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      const desktopContainer = desktopSearchContainerRef.current;
      const mobileContainer = mobileSearchContainerRef.current;
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      const isInsideDesktop = desktopContainer?.contains(target) ?? false;
      const isInsideMobile = mobileContainer?.contains(target) ?? false;

      if (!isInsideDesktop && !isInsideMobile) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const term = deferredSearchTerm.trim();

    if (term.length < 2) {
      setIsSearching(false);
      setSearchResults([]);
      setSearchError("");
      setShowAllResults(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsSearching(true);
        setSearchError("");

        try {
          const response = await fetch(
            `/api/productos/search?search=${encodeURIComponent(term)}`,
            {
              signal: controller.signal,
              credentials: "same-origin",
            }
          );
          const payload = (await response.json()) as unknown;

          if (!response.ok) {
            setSearchResults([]);
            setSearchError(getSearchError(payload));
            setIsSearchOpen(true);
            return;
          }

          if (!isProductArray(payload)) {
            setSearchResults([]);
            setSearchError("La busqueda devolvio un formato invalido.");
            setIsSearchOpen(true);
            return;
          }

          setSearchResults(payload);
          setSearchError("");
          setIsSearchOpen(true);
        } catch (error: unknown) {
          if (
            typeof error === "object" &&
            error !== null &&
            "name" in error &&
            error.name === "AbortError"
          ) {
            return;
          }

          setSearchResults([]);
          setSearchError("No se pudo realizar la busqueda.");
          setIsSearchOpen(true);
        } finally {
          if (!controller.signal.aborted) {
            setIsSearching(false);
          }
        }
      })();
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [deferredSearchTerm]);

  async function handleResultAction(product: Product): Promise<void> {
    if (product.medidas.length > 0 || product.stock <= 0) {
      setActiveProduct(product);
      setIsSearchOpen(false);
      setIsMobileSearchVisible(false);
      return;
    }

    try {
      await addItem(product.id_producto, 1);
      setSearchTerm("");
      setSearchResults([]);
      setSearchError("");
      setShowAllResults(false);
      setIsSearchOpen(false);
      setIsMobileSearchVisible(false);
    } catch {
      setActiveProduct(product);
      setIsSearchOpen(false);
      setIsMobileSearchVisible(false);
    }
  }

  function handleOpenProduct(product: Product): void {
    setActiveProduct(product);
    setIsSearchOpen(false);
    setIsMobileSearchVisible(false);
  }

  const hasSearchTerm = searchTerm.trim().length >= 2;
  const visibleResults =
    showAllResults || searchResults.length <= 3
      ? searchResults
      : searchResults.slice(0, 3);

  function renderDesktopSearchField() {
    return (
      <div className="relative">
        <Input
          type="text"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setShowAllResults(false);
          }}
          onFocus={() => {
            if (searchTerm.trim().length >= 2) {
              setIsSearchOpen(true);
            }
          }}
          placeholder="Buscar productos..."
          className="h-12 rounded-2xl border-zinc-300 pr-12 pl-4 text-sm sm:h-14 sm:text-base"
          autoComplete="off"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-14 items-center justify-center rounded-r-2xl border-l border-zinc-200 bg-zinc-50 text-zinc-500">
          {isSearching ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Search className="size-5" />
          )}
        </div>
      </div>
    );
  }

  function renderMobileSearchField() {
    return (
      <div
        className={`relative overflow-hidden rounded-full border border-zinc-300 bg-white transition-all duration-300 ${isMobileSearchVisible
            ? "w-full opacity-100"
            : "w-10 opacity-100"
          }`}
      >
        {isMobileSearchVisible ? (
          <>
            <Input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setShowAllResults(false);
              }}
              onFocus={() => {
                if (searchTerm.trim().length >= 2) {
                  setIsSearchOpen(true);
                }
              }}
              placeholder="Buscar..."
              className="h-10 border-0 bg-transparent pr-10 pl-3 text-sm shadow-none focus-visible:ring-0"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchVisible(false);
                setIsSearchOpen(false);
              }}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-500 transition hover:text-black"
            >
              <X className="size-4" />
              <span className="sr-only">Cerrar busqueda</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsMobileSearchVisible(true);
              if (searchTerm.trim().length >= 2) {
                setIsSearchOpen(true);
              }
            }}
            className="flex h-10 w-10 items-center justify-center text-zinc-600 transition hover:text-black"
          >
            <Search className="size-5" />
            <span className="sr-only">Buscar productos</span>
          </button>
        )}
      </div>
    );
  }

  function renderSearchResults(isMobile: boolean) {
    if (!isSearchOpen || !hasSearchTerm) {
      return null;
    }

    return (
      <div
        className={`${isMobile
            ? "fixed inset-x-4 top-24"
            : "absolute left-0 right-0 top-[calc(100%+0.75rem)]"
          } z-[80] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.16)]`}
      >
        <div className="border-b border-zinc-100 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
            Busqueda
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-black">
            Resultados de la busqueda
          </h2>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
          {searchError ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
              {searchError}
            </div>
          ) : null}

          {!searchError && !isSearching && searchResults.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
              No encontramos productos para {searchTerm.trim()}.
            </div>
          ) : null}

          <div className="space-y-2">
            {visibleResults.map((product) => (
              <div
                key={product.id_producto}
                className="flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2 transition hover:border-zinc-200 hover:bg-zinc-50"
              >
                <button
                  type="button"
                  onClick={() => handleOpenProduct(product)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
                    {product.imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imagen}
                        alt={product.nombre}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                        Sin
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-black">
                      {product.nombre}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">
                      {product.descripcion || "Sin descripcion disponible."}
                    </p>
                    <p className="mt-1 text-base font-semibold text-black">
                      {formatCurrency(product.precio)}
                    </p>
                  </div>
                </button>

                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="shrink-0 rounded-full"
                  onClick={() => {
                    void handleResultAction(product);
                  }}
                >
                  <Plus />
                  <span className="sr-only">
                    {product.medidas.length > 0 ? "Ver detalle" : "Agregar producto"}
                  </span>
                </Button>
              </div>
            ))}
          </div>
        </div>

        {searchResults.length > 3 ? (
          <div className="border-t border-zinc-100 px-5 py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowAllResults((current) => !current)}
            >
              {showAllResults ? "Ver menos resultados" : "Ver todos los resultados"}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <header className="relative z-50 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 md:gap-5">
            <Link href="/" className="inline-flex items-center text-black">
              <Image
                src="/assets/deprimeracollection.jpg"
                alt="De Primera Collection"
                width={80}
                height={80}
                className="size-16 rounded-3xl border border-zinc-200 object-cover shadow-sm sm:size-20"
                priority
              />
              <span className="sr-only">De Primera Collection</span>
            </Link>

            <div
              ref={desktopSearchContainerRef}
              className="relative hidden min-w-0 flex-1 md:block"
            >
              {renderDesktopSearchField()}
              {renderSearchResults(false)}
            </div>

            <nav className="flex min-w-0 flex-1 items-center justify-end gap-2 text-sm text-zinc-600 sm:gap-3 md:flex-none md:min-w-fit">
              <div
                ref={mobileSearchContainerRef}
                className="relative min-w-0 md:hidden"
                style={{
                  flexGrow: isMobileSearchVisible ? 1 : 0,
                  flexShrink: 0,
                  flexBasis: isMobileSearchVisible ? 0 : "2.5rem",
                  transition:
                    "flex-grow 300ms cubic-bezier(.4,0,.2,1), flex-basis 300ms cubic-bezier(.4,0,.2,1)",
                }}
              >
                {renderMobileSearchField()}
                {renderSearchResults(true)}
              </div>
              <Link href="/" className="shrink-0 transition hover:text-black md:inline">
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
                  <span className="hidden text-sm font-medium text-black sm:inline">
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
        </div>
      </header>

      <div
        className={`fixed right-4 bottom-4 z-30 transition-all duration-300 sm:right-6 sm:bottom-6 ${showFloatingCartButton
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

      <ProductQuickViewDialog
        product={activeProduct}
        open={Boolean(activeProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveProduct(null);
          }
        }}
      />
      <CartDrawer />
    </>
  );
}
