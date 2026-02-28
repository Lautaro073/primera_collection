"use client";

/* eslint-disable @next/next/no-img-element */

import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useStoreCart } from "@/components/storefront/StoreCartProvider";
import { formatCurrency } from "@/lib/storefront";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const {
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
  const whatsappPhone = (process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "").replace(/\D/g, "");
  const quantityByProduct = items.reduce<Record<string, number>>((totals, item) => {
    return {
      ...totals,
      [item.id_producto]: (totals[item.id_producto] || 0) + item.cantidad,
    };
  }, {});

  function buildWhatsappMessage(): string {
    const lines = items.map((item) => {
      const selectedMeasure = item.medida_seleccionada
        ? ` | Talle: ${item.medida_seleccionada}`
        : "";

      return `- ${item.nombre} x${item.cantidad}${selectedMeasure} | ${formatCurrency(
        item.precio * item.cantidad
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
      buildWhatsappMessage()
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  async function handleQuantityChange(
    productId: string,
    nextQuantity: number,
    selectedMeasure?: string | null
  ): Promise<void> {
    try {
      setError("");
      await updateItemQuantity(productId, nextQuantity, selectedMeasure);
    } catch (currentError: unknown) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo actualizar el carrito."
      );
    }
  }

  async function handleRemove(
    productId: string,
    selectedMeasure?: string | null
  ): Promise<void> {
    try {
      setError("");
      await removeItem(productId, selectedMeasure);
    } catch (currentError: unknown) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo eliminar el producto."
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
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-[-20px_0_80px_rgba(0,0,0,0.12)] transition-transform duration-300 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
              Carrito
            </p>
            <h2 className="mt-1 text-lg font-semibold text-black">
              {itemCount} producto(s)
            </h2>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={closeDrawer}>
            <X />
            <span className="sr-only">Cerrar carrito</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {error ? (
            <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
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
                    const productQuantityInCart = quantityByProduct[item.id_producto] || 0;
                    const canIncreaseQuantity = productQuantityInCart < item.stock;

                    return (
                  <div className="flex gap-3">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
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
                        <h3 className="truncate text-sm font-medium text-black">
                          {item.nombre}
                        </h3>
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
                                item.medida_seleccionada
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
                                item.medida_seleccionada
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
              <p className="mt-1 text-sm text-zinc-500">
                Agrega productos desde el detalle y apareceran aqui.
              </p>
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

          {items.length > 0 ? (
            <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
Al momento de pedir el link de pago se le notificara la disponibilidad del Talle.
            </div>
          ) : null}

          <div className="space-y-2">
            <Button
              type="button"
              className="w-full"
              onClick={handleWhatsappCheckout}
              disabled={items.length === 0 || !whatsappPhone}
            >
              Finalizar por WhatsApp
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={closeDrawer}>
              Seguir viendo
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
