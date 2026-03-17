"use client";

import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStoreCart } from "@/components/storefront/StoreCartProvider";
import type { CustomerAddress, ShippingQuote } from "@/types/domain";
import { isCheckoutEnabled, isShippingQuotesEnabled, isUserAccountsEnabled } from "@/lib/commerce-mode";
import { isCloudinaryImageUrl, storefrontImageLoader } from "@/lib/images";
import { formatCurrency } from "@/lib/storefront";
import { Button } from "@/components/ui/button";

interface ShippingEstimateResponse {
  postal_code: string;
  quotes: ShippingQuote[];
}

export function CartDrawer() {
  const {
    cartId,
    items,
    itemCount,
    totalAmount,
    isLoading,
    isDrawerOpen,
    closeDrawer,
    updateItemQuantity,
    removeItem,
  } = useStoreCart();
  const [error, setError] = useState("");
  const [shippingError, setShippingError] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const checkoutEnabled = isCheckoutEnabled() && isUserAccountsEnabled();
  const shippingEnabled = isShippingQuotesEnabled() && checkoutEnabled;
  const whatsappPhone = (process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "").replace(/\D/g, "");
  const quantityByLine = useMemo(
    () =>
      items.reduce<Record<string, number>>((totals, item) => {
        totals[item.clave] = item.cantidad;
        return totals;
      }, {}),
    [items],
  );

  function buildWhatsappMessage(): string {
    const lines = items.map((item) => {
      const selectedMeasure = item.medida_seleccionada ? ` | Talle: ${item.medida_seleccionada}` : "";

      return `- ${item.nombre} x${item.cantidad}${selectedMeasure} | ${formatCurrency(
        item.precio * item.cantidad,
      )}`;
    });

    return [
      "Hola, quiero finalizar esta compra:",
      "",
      ...lines,
      "",
      `Total: ${formatCurrency(totalAmount)}`,
    ].join("\n");
  }

  function handleWhatsappCheckout(): void {
    if (!whatsappPhone || items.length === 0) {
      return;
    }

    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
      buildWhatsappMessage(),
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeDrawer();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [closeDrawer, isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen || !shippingEnabled) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/me/addresses", {
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as CustomerAddress[];

        if (!cancelled && Array.isArray(payload)) {
          const defaultAddress = payload.find((address) => address.is_default) || payload[0] || null;

          if (defaultAddress) {
            setPostalCode(defaultAddress.postal_code);
          }
        }
      } catch {
        // no-op: the shipping estimate can still be calculated manually
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDrawerOpen, shippingEnabled]);

  const calculateShipping = useCallback(async (): Promise<void> => {
    if (!shippingEnabled || !cartId || items.length === 0) {
      return;
    }

    const normalizedPostalCode = postalCode.trim();

    if (normalizedPostalCode.length < 4) {
      setShippingQuotes([]);
      setShippingError("Ingresa un codigo postal valido.");
      return;
    }

    try {
      setShippingLoading(true);
      setShippingError("");
      const response = await fetch("/api/shipping/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          cart_id: cartId,
          postal_code: normalizedPostalCode,
        }),
      });
      const payload = (await response.json()) as ShippingEstimateResponse | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "No se pudo calcular el envio.",
        );
      }

      const quotes = Array.isArray((payload as ShippingEstimateResponse).quotes)
        ? (payload as ShippingEstimateResponse).quotes
        : [];

      if (quotes.length === 0) {
        setShippingQuotes([]);
        setShippingError("Por ahora no encontramos opciones para ese codigo postal.");
        return;
      }

      setShippingQuotes(quotes);
    } catch (currentError: unknown) {
      setShippingQuotes([]);
      setShippingError(
        currentError instanceof Error ? currentError.message : "No se pudo calcular el envio.",
      );
    } finally {
      setShippingLoading(false);
    }
  }, [cartId, items.length, postalCode, shippingEnabled]);

  const homeQuote = shippingQuotes.find((quote) => quote.delivery_type === "domicilio") || null;
  const branchQuote = shippingQuotes.find((quote) => quote.delivery_type === "sucursal") || null;

  async function handleQuantityChange(
    productId: string,
    nextQuantity: number,
    selectedMeasure?: string | null,
  ): Promise<void> {
    try {
      setError("");
      await updateItemQuantity(productId, nextQuantity, selectedMeasure);
    } catch (currentError: unknown) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo actualizar el carrito.",
      );
    }
  }

  async function handleRemove(
    productId: string,
    selectedMeasure?: string | null,
  ): Promise<void> {
    try {
      setError("");
      await removeItem(productId, selectedMeasure);
    } catch (currentError: unknown) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo eliminar el producto.",
      );
    }
  }

  return (
    <>
      <div
        aria-hidden={!isDrawerOpen}
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-black/35 transition-opacity duration-300 ${
          isDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-cart-title"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-[-20px_0_80px_rgba(0,0,0,0.12)] transition-transform duration-300 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
              Carrito
            </p>
            <h2 id="store-cart-title" className="mt-1 text-lg font-semibold text-black">
              {itemCount} producto(s)
            </h2>
          </div>

          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
          >
            <X />
            <span className="sr-only">Cerrar carrito</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {error ? (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600"
            >
              {error}
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <article
                  key={item.clave}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3"
                >
                  {(() => {
                    const productQuantityInCart = quantityByLine[item.clave] || 0;
                    const canIncreaseQuantity = productQuantityInCart < item.stock;

                    return (
                      <div className="flex gap-3">
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                          {item.imagen ? (
                            <Image
                              src={item.imagen}
                              alt={item.nombre}
                              fill
                              loader={
                                isCloudinaryImageUrl(item.imagen) ? storefrontImageLoader : undefined
                              }
                              quality={50}
                              sizes="64px"
                              className="h-full w-full object-cover"
                              draggable={false}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-zinc-100 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                              Sin
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="space-y-1">
                            <h3 className="truncate text-sm font-medium text-black">{item.nombre}</h3>
                            {item.medida_seleccionada ? (
                              <p className="text-xs text-zinc-500">
                                Talle: {item.medida_seleccionada}
                              </p>
                            ) : null}
                            <p className="text-sm font-semibold text-black">
                              {formatCurrency(item.precio)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-full"
                                onClick={() =>
                                  void handleQuantityChange(
                                    item.id_producto,
                                    item.cantidad - 1,
                                    item.medida_seleccionada,
                                  )
                                }
                                disabled={isLoading}
                              >
                                <Minus />
                                <span className="sr-only">Restar unidad</span>
                              </Button>
                              <span className="min-w-7 text-center text-sm font-medium text-black">
                                {item.cantidad}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-full"
                                onClick={() =>
                                  void handleQuantityChange(
                                    item.id_producto,
                                    item.cantidad + 1,
                                    item.medida_seleccionada,
                                  )
                                }
                                disabled={isLoading || !canIncreaseQuantity}
                              >
                                <Plus />
                                <span className="sr-only">Sumar unidad</span>
                              </Button>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-zinc-500 hover:text-black"
                              onClick={() =>
                                void handleRemove(item.id_producto, item.medida_seleccionada)
                              }
                              disabled={isLoading}
                            >
                              Quitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </article>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 text-center">
              <ShoppingBag className="mb-3 size-8 text-zinc-400" />
              <p className="text-sm font-medium text-black">Tu carrito esta vacio</p>
              <p className="mt-1 text-sm text-zinc-500">Sumá productos y los vas a ver acá.</p>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 px-4 py-4 sm:px-5">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Total</span>
            <span className="text-lg font-semibold text-black">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {checkoutEnabled && items.length > 0 ? (
            <div className="mb-4 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
              <label htmlFor="cart-postal-code" className="text-sm font-medium text-black">
                Codigo postal
              </label>
              <div className="flex gap-2">
                <input
                  id="cart-postal-code"
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value)}
                  inputMode="numeric"
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-black shadow-xs outline-none transition-[color,box-shadow] placeholder:text-zinc-400 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-zinc-200"
                  placeholder="Ej: 4000"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={postalCode.trim().length < 4 || shippingLoading}
                  onClick={() => {
                    void calculateShipping();
                  }}
                >
                  Calcular
                </Button>
              </div>

              {shippingLoading ? (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <LoaderCircle className="size-4 animate-spin" />
                  Calculando envio...
                </div>
              ) : homeQuote || branchQuote ? (
                <div className="space-y-1 text-sm text-zinc-700">
                  {homeQuote ? (
                    <div className="flex items-center justify-between gap-3">
                      <span>Envio a domicilio</span>
                      <span className="font-medium text-black">
                        {formatCurrency(homeQuote.amount)}
                      </span>
                    </div>
                  ) : null}
                  {branchQuote ? (
                    <div className="flex items-center justify-between gap-3">
                      <span>Retiro en sucursal</span>
                      <span className="font-medium text-black">
                        {formatCurrency(branchQuote.amount)}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {shippingError ? (
                <div className="text-sm text-zinc-600">{shippingError}</div>
              ) : null}
            </div>
          ) : items.length > 0 ? (
            <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
              Antes de enviarte el link de pago, te confirmamos disponibilidad del talle.
            </div>
          ) : null}

          <div className="space-y-2">
            {checkoutEnabled ? (
              items.length === 0 ? (
                <Button type="button" className="w-full" disabled>
                  Continuar compra
                </Button>
              ) : (
                  <Button asChild className="w-full">
                    <Link href="/checkout" onClick={closeDrawer}>
                      Continuar compra
                    </Link>
                  </Button>
              )
            ) : (
              <Button
                type="button"
                className="w-full"
                onClick={handleWhatsappCheckout}
                disabled={items.length === 0 || !whatsappPhone}
              >
                Finalizar compra por WhatsApp
              </Button>
            )}

            <Button type="button" variant="outline" className="w-full" onClick={closeDrawer}>
              Seguir viendo
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
