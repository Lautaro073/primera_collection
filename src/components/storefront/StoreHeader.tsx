"use client";

import dynamic from "next/dynamic";
import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Search, ShoppingBag, X } from "lucide-react";
import { useStoreCart } from "@/components/storefront/StoreCartProvider";
import type { ProductSearchResult } from "@/types/domain";
import { isProductSearchResultArray } from "@/lib/catalog/contracts";
import { isEcommerceEnabled, isUserAccountsEnabled } from "@/lib/commerce-mode";
import { isCloudinaryImageUrl, storefrontImageLoader } from "@/lib/images";
import { formatCurrency, getProductHref } from "@/lib/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CartDrawer = dynamic(
  () => import("@/components/storefront/CartDrawer").then((module) => module.CartDrawer),
  { ssr: false }
);

const ProductQuickViewDialog = dynamic(
  () =>
    import("@/components/storefront/ProductQuickViewDialog").then(
      (module) => module.ProductQuickViewDialog
    ),
  { ssr: false }
);

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
  const router = useRouter();
  const ecommerceEnabled = isEcommerceEnabled();
  const userAccountsEnabled = isUserAccountsEnabled();
  const { addItem, isDrawerOpen, itemCount, totalAmount, openDrawer } = useStoreCart();
  const desktopSearchInputId = useId();
  const mobileSearchInputId = useId();
  const desktopSearchResultsId = useId();
  const mobileSearchResultsId = useId();
  const cartButtonRef = useRef<HTMLSpanElement | null>(null);
  const desktopSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const [showFloatingCartButton, setShowFloatingCartButton] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeProduct, setActiveProduct] = useState<ProductSearchResult | null>(null);
  const [highlightedResultIndex, setHighlightedResultIndex] = useState(-1);
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
            `/api/productos/search?search=${encodeURIComponent(term)}&limit=6`,
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

          if (!isProductSearchResultArray(payload)) {
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

  useEffect(() => {
    setHighlightedResultIndex(-1);
  }, [searchResults, showAllResults, searchTerm]);

  async function handleResultAction(product: ProductSearchResult): Promise<void> {
    if (product.medidas.length > 0 || product.stock <= 0) {
      openProductDialog(product);
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

  function openProductDialog(product: ProductSearchResult): void {
    setActiveProduct(product);
    setIsSearchOpen(false);
    setIsMobileSearchVisible(false);
  }

  const hasSearchTerm = searchTerm.trim().length >= 2;
  const visibleResults =
    showAllResults || searchResults.length <= 3
      ? searchResults
      : searchResults.slice(0, 3);

  function handleSearchInputChange(nextValue: string): void {
    setSearchTerm(nextValue);
    setShowAllResults(false);
  }

  function handleSearchInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (!isSearchOpen || visibleResults.length === 0) {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedResultIndex((current) =>
        current >= visibleResults.length - 1 ? 0 : current + 1
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedResultIndex((current) =>
        current <= 0 ? visibleResults.length - 1 : current - 1
      );
      return;
    }

    if (event.key === "Enter" && highlightedResultIndex >= 0) {
      event.preventDefault();
      const highlightedProduct = visibleResults[highlightedResultIndex];

      if (highlightedProduct) {
        if (ecommerceEnabled) {
          setIsSearchOpen(false);
          setIsMobileSearchVisible(false);
          router.push(getProductHref(highlightedProduct));
        } else {
          openProductDialog(highlightedProduct);
        }
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsSearchOpen(false);
    }
  }

  function renderDesktopSearchField() {
    return (
      <div
        className="relative"
        role="combobox"
        aria-expanded={isSearchOpen}
        aria-haspopup="listbox"
        aria-controls={desktopSearchResultsId}
      >
        <label htmlFor={desktopSearchInputId} className="sr-only">
          Buscar productos
        </label>
        <Input
          id={desktopSearchInputId}
          type="text"
          value={searchTerm}
          onChange={(event) => handleSearchInputChange(event.target.value)}
          onFocus={() => {
            if (searchTerm.trim().length >= 2) {
              setIsSearchOpen(true);
            }
          }}
          onKeyDown={handleSearchInputKeyDown}
          placeholder="Buscar productos..."
          aria-autocomplete="list"
          aria-controls={desktopSearchResultsId}
          aria-activedescendant={
            highlightedResultIndex >= 0
              ? `${desktopSearchResultsId}-option-${highlightedResultIndex}`
              : undefined
          }
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
        role={isMobileSearchVisible ? "combobox" : undefined}
        aria-expanded={isMobileSearchVisible ? isSearchOpen : undefined}
        aria-haspopup={isMobileSearchVisible ? "listbox" : undefined}
        aria-controls={isMobileSearchVisible ? mobileSearchResultsId : undefined}
        className={`relative overflow-hidden rounded-full border border-zinc-300 bg-white transition-all duration-300 ${isMobileSearchVisible
            ? "w-full opacity-100"
            : "w-10 opacity-100"
          }`}
      >
        {isMobileSearchVisible ? (
          <>
            <label htmlFor={mobileSearchInputId} className="sr-only">
              Buscar productos
            </label>
            <Input
              id={mobileSearchInputId}
              type="text"
              value={searchTerm}
              onChange={(event) => handleSearchInputChange(event.target.value)}
              onFocus={() => {
                if (searchTerm.trim().length >= 2) {
                  setIsSearchOpen(true);
                }
              }}
              onKeyDown={handleSearchInputKeyDown}
              placeholder="Buscar..."
              aria-autocomplete="list"
              aria-controls={mobileSearchResultsId}
              aria-expanded={isSearchOpen}
              aria-activedescendant={
                highlightedResultIndex >= 0
                  ? `${mobileSearchResultsId}-option-${highlightedResultIndex}`
                  : undefined
              }
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

    const resultsId = isMobile ? mobileSearchResultsId : desktopSearchResultsId;

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

        <div
          id={resultsId}
          role="listbox"
          className="max-h-[60vh] overflow-y-auto px-5 py-3"
        >
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
            {visibleResults.map((product, index) => (
              <div
                key={product.id_producto}
                id={`${resultsId}-option-${index}`}
                role="option"
                aria-selected={highlightedResultIndex === index}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2 transition hover:border-zinc-200 hover:bg-zinc-50",
                  highlightedResultIndex === index && "border-zinc-200 bg-zinc-50"
                )}
              >
                {ecommerceEnabled ? (
                  <Link
                    href={getProductHref(product)}
                    onMouseEnter={() => setHighlightedResultIndex(index)}
                    onFocus={() => setHighlightedResultIndex(index)}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setIsMobileSearchVisible(false);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
                      {product.imagen ? (
                        <Image
                          src={product.imagen}
                          alt={product.nombre}
                          fill
                          loader={isCloudinaryImageUrl(product.imagen) ? storefrontImageLoader : undefined}
                          quality={55}
                          sizes="64px"
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
                  </Link>
                ) : (
                  <button
                    type="button"
                    onMouseEnter={() => setHighlightedResultIndex(index)}
                    onFocus={() => setHighlightedResultIndex(index)}
                    onClick={() => openProductDialog(product)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
                      {product.imagen ? (
                        <Image
                          src={product.imagen}
                          alt={product.nombre}
                          fill
                          loader={isCloudinaryImageUrl(product.imagen) ? storefrontImageLoader : undefined}
                          quality={55}
                          sizes="64px"
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
                )}

                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="shrink-0 rounded-full"
                  onMouseEnter={() => setHighlightedResultIndex(index)}
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
                sizes="80px"
                className="size-16 rounded-3xl border border-zinc-200 object-cover shadow-sm sm:size-20"
                priority
                fetchPriority="high"
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
              {userAccountsEnabled ? (
                <Link href="/mi-cuenta" className="shrink-0 transition hover:text-black md:inline">
                  Mi cuenta
                </Link>
              ) : null}
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

      {activeProduct ? (
        <ProductQuickViewDialog
          key={activeProduct.id_producto}
          product={activeProduct}
          open={Boolean(activeProduct)}
          onOpenChange={(open) => {
            if (!open) {
              setActiveProduct(null);
            }
          }}
        />
      ) : null}
      {isDrawerOpen ? <CartDrawer /> : null}
    </>
  );
}
