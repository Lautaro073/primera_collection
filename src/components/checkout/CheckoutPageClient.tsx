"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, RefreshCcw } from "lucide-react";
import { CustomerAddressForm } from "@/components/customer/CustomerAddressForm";
import type {
  CheckoutFulfillmentType,
  CheckoutSessionSummary,
  CustomerAddress,
  OrderSummary,
} from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStoreCart } from "@/components/storefront/StoreCartProvider";
import { isShippingQuotesEnabled } from "@/lib/commerce-mode";
import { formatCurrency } from "@/lib/storefront";
import { isErrorWithMessage } from "@/types/shared";

interface CheckoutPageClientProps {
  addresses: CustomerAddress[];
}

async function createOrRefreshCheckoutSession({
  addressId,
  cartId,
  fulfillmentType,
  postalCode,
  sessionId,
}: {
  addressId: string | null;
  cartId: string;
  fulfillmentType: CheckoutFulfillmentType;
  postalCode: string | null;
  sessionId: string | null;
}): Promise<CheckoutSessionSummary> {
  const endpoint = sessionId
    ? `/api/checkout/session/${sessionId}/refresh`
    : "/api/checkout/session";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      address_id: addressId,
      cart_id: cartId,
      fulfillment_type: fulfillmentType,
      postal_code: postalCode,
    }),
  });
  const payload = (await response.json()) as CheckoutSessionSummary | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "No se pudo preparar el checkout."
    );
  }

  return payload as CheckoutSessionSummary;
}

export function CheckoutPageClient({ addresses }: CheckoutPageClientProps) {
  const { cartId, isReady } = useStoreCart();
  const shippingEnabled = isShippingQuotesEnabled();
  const [addressesState, setAddressesState] = useState<CustomerAddress[]>(addresses);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<CheckoutFulfillmentType>("shipping");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find((address) => address.is_default)?.id || addresses[0]?.id || null
  );
  const [postalCode, setPostalCode] = useState<string>(
    addresses.find((address) => address.is_default)?.postal_code || addresses[0]?.postal_code || ""
  );
  const [session, setSession] = useState<CheckoutSessionSummary | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  const selectedAddress = useMemo(
    () => addressesState.find((address) => address.id === selectedAddressId) || null,
    [addressesState, selectedAddressId],
  );

  useEffect(() => {
    if (selectedAddress && fulfillmentType === "shipping") {
      setPostalCode(selectedAddress.postal_code);
      return;
    }

    if (fulfillmentType === "shipping") {
      setPostalCode("");
    }
  }, [fulfillmentType, selectedAddress]);

  async function syncCheckoutSession(options?: { force?: boolean }): Promise<void> {
    if (!isReady || !cartId) {
      return;
    }

    const shouldUseAddress = fulfillmentType === "shipping" && Boolean(selectedAddressId);
    const normalizedPostalCode = postalCode.trim();
    const canRequestShippingQuote = fulfillmentType === "pickup" || shouldUseAddress;

    if (!canRequestShippingQuote && !options?.force) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const nextSession = await createOrRefreshCheckoutSession({
        addressId: shouldUseAddress ? selectedAddressId : null,
        cartId,
        fulfillmentType,
        postalCode: fulfillmentType === "shipping" ? normalizedPostalCode || null : null,
        sessionId: sessionIdRef.current,
      });

      sessionIdRef.current = nextSession.id_checkout_session;
      setSession(nextSession);
      setConfirmedOrder(null);
    } catch (currentError: unknown) {
      setError(
        isErrorWithMessage(currentError)
          ? currentError.message
          : "No se pudo preparar el checkout."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddressSaved(address: CustomerAddress): void {
    setAddressesState((current: CustomerAddress[]) => {
      const withoutCurrent = current.filter((item) => item.id !== address.id);
      const nextAddresses = address.is_default
        ? withoutCurrent.map((item) => ({ ...item, is_default: false }))
        : withoutCurrent;

      return [...nextAddresses, address];
    });
    setSelectedAddressId(address.id);
    setPostalCode(address.postal_code);
    setShowAddressForm(false);
  }

  useEffect(() => {
    if (!isReady || !cartId) {
      return;
    }

    let cancelled = false;

    const shouldUseAddress = fulfillmentType === "shipping" && Boolean(selectedAddressId);
    const normalizedPostalCode = postalCode.trim();
    const canRequestShippingQuote = fulfillmentType === "pickup" || shouldUseAddress;

    if (!canRequestShippingQuote) {
      setSession(null);
      return;
    }

    void (async () => {
      try {
        setIsLoading(true);
        setError("");
        const nextSession = await createOrRefreshCheckoutSession({
          addressId: shouldUseAddress ? selectedAddressId : null,
          cartId,
          fulfillmentType,
          postalCode: fulfillmentType === "shipping" ? normalizedPostalCode || null : null,
          sessionId: sessionIdRef.current,
        });

        if (!cancelled) {
          sessionIdRef.current = nextSession.id_checkout_session;
          setSession(nextSession);
          setConfirmedOrder(null);
        }
      } catch (currentError: unknown) {
        if (!cancelled) {
          setError(
            isErrorWithMessage(currentError)
              ? currentError.message
              : "No se pudo preparar el checkout."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cartId, fulfillmentType, isReady, postalCode, selectedAddressId]);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-black sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Checkout
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Revisar pedido
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-600">
            Revisa tu compra antes de confirmar.
          </p>
        </section>

        {confirmedOrder ? (
          <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
            <CardContent className="space-y-4 p-6 sm:p-8">
              <div className="flex items-center gap-3 text-emerald-700">
                <CheckCircle2 className="size-6" />
                <p className="text-sm font-medium uppercase tracking-[0.18em]">Pedido creado</p>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Pedido #{confirmedOrder.id_orden}
                </h2>
                <p className="text-sm text-zinc-600">
                  Tu pedido ya fue creado.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">Total actual</span>
                  <span className="font-medium text-black">
                    {formatCurrency(confirmedOrder.pricing.total || confirmedOrder.pricing.subtotal)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/mi-cuenta">Volver a mi cuenta</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Seguir comprando</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:items-start">
            <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
              <CardHeader>
                <CardTitle>Entrega</CardTitle>
                <CardDescription>
                  Elige si el pedido se retira en el local o se envia a domicilio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${fulfillmentType === "shipping"
                      ? "border-black bg-white"
                      : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                      }`}
                  >
                    <input
                      type="radio"
                      name="fulfillment-type"
                      checked={fulfillmentType === "shipping"}
                      onChange={() => setFulfillmentType("shipping")}
                      className="mt-1 size-4"
                    />
                    <div className="space-y-1 text-sm text-zinc-700">
                      <p className="font-medium text-black">Envio</p>
                      <p>Selecciona una direccion de envio o añade una nueva.</p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${fulfillmentType === "pickup"
                      ? "border-black bg-white"
                      : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                      }`}
                  >
                    <input
                      type="radio"
                      name="fulfillment-type"
                      checked={fulfillmentType === "pickup"}
                      onChange={() => setFulfillmentType("pickup")}
                      className="mt-1 size-4"
                    />
                    <div className="space-y-1 text-sm text-zinc-700">
                      <p className="font-medium text-black">Retiro en el local</p>
                      <p>Retiros del local son sin cargo.</p>
                    </div>
                  </label>
                </div>

                {fulfillmentType === "shipping" ? (
                  addressesState.length > 0 ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-black">Direccion guardada</p>
                          <p className="text-sm text-zinc-500">
                            El costo se calcula automaticamente con el codigo postal de la direccion elegida.
                          </p>
                        </div>

                        {!showAddressForm ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => setShowAddressForm(true)}
                          >
                            Agregar direccion nueva
                          </Button>
                        ) : (
                          <CustomerAddressForm
                            title="Nueva direccion"
                            description="Guardá una dirección para usarla en esta compra."
                            onCancel={() => setShowAddressForm(false)}
                            onSaved={handleAddressSaved}
                          />
                        )}

                        {addressesState.map((address) => (
                          <label
                            key={address.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${selectedAddressId === address.id
                              ? "border-black bg-white"
                              : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                              }`}
                          >
                            <input
                              type="radio"
                              name="checkout-address"
                              value={address.id}
                              checked={selectedAddressId === address.id}
                              onChange={() => setSelectedAddressId(address.id)}
                              className="mt-1 size-4"
                            />
                            <div className="space-y-1 text-sm text-zinc-700">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-black">{address.recipient_name}</span>
                                {address.is_default ? (
                                  <span className="rounded-full bg-black px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white">
                                    Predeterminada
                                  </span>
                                ) : null}
                              </div>
                              <p>{address.line_1}</p>
                              {address.line_2 ? <p>{address.line_2}</p> : null}
                              <p>
                                {address.city}, {address.province} - {address.postal_code}
                              </p>
                              <p>{address.phone}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <CustomerAddressForm
                        title="Agregar direccion"
                        description="Guardá una dirección para continuar con el envío."
                        onCancel={() => undefined}
                        onSaved={handleAddressSaved}
                      />
                    )
                ) : (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
                    Retiro en el local sin costo adicional.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Resumen del pedido</CardTitle>
                  </div>

                  {session && cartId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isLoading || (fulfillmentType === "shipping" && !selectedAddressId)}
                      onClick={() => {
                        void (async () => {
                          try {
                            setIsLoading(true);
                            setError("");
                            const refreshedSession = await createOrRefreshCheckoutSession({
                              addressId:
                                fulfillmentType === "shipping" && selectedAddressId
                                  ? selectedAddressId
                                  : null,
                              cartId,
                              fulfillmentType,
                              postalCode:
                                fulfillmentType === "shipping" ? postalCode.trim() || null : null,
                              sessionId: sessionIdRef.current,
                            });
                            sessionIdRef.current = refreshedSession.id_checkout_session;
                            setSession(refreshedSession);
                          } catch (currentError: unknown) {
                            setError(
                              isErrorWithMessage(currentError)
                                ? currentError.message
                                : "No se pudo refrescar el checkout."
                            );
                          } finally {
                            setIsLoading(false);
                          }
                        })();
                      }}
                    >
                      <RefreshCcw />
                      Actualizar
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {error ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
                    {error}
                  </div>
                ) : null}

                {!selectedAddress && fulfillmentType === "shipping" ? (
                  <p className="text-sm text-zinc-600">
                    Agrega o selecciona una direccion para continuar con el envio.
                  </p>
                ) : isLoading && !session ? (
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
                    <LoaderCircle className="size-4 animate-spin" />
                    Preparando tu pedido...
                  </div>
                ) : session ? (
                  <div className="space-y-4">
                    {shippingEnabled && session.shipping.fulfillment_type === "shipping" ? (
                      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-black">Opciones de envio</p>
                          <p className="text-sm text-zinc-500">
                            Estas son las opciones disponibles para la direccion elegida.
                          </p>
                        </div>

                        {session.shipping.quotes.length > 0 ? (
                          <div className="space-y-2">
                            {session.shipping.quotes.map((quote) => (
                              <label
                                key={quote.id}
                                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${session.shipping.selected_quote_id === quote.id
                                  ? "border-black bg-white"
                                  : "border-zinc-200 bg-white/80 hover:border-zinc-300"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="shipping-quote"
                                  checked={session.shipping.selected_quote_id === quote.id}
                                  onChange={() => {
                                    void (async () => {
                                      try {
                                        setIsLoading(true);
                                        setError("");
                                        const response = await fetch(
                                          `/api/checkout/session/${session.id_checkout_session}/shipping`,
                                          {
                                            method: "PUT",
                                            headers: {
                                              "Content-Type": "application/json",
                                            },
                                            credentials: "same-origin",
                                            body: JSON.stringify({ quote_id: quote.id }),
                                          }
                                        );
                                        const payload = (await response.json()) as
                                          | CheckoutSessionSummary
                                          | { error?: string };

                                        if (!response.ok) {
                                          throw new Error(
                                            "error" in payload && typeof payload.error === "string"
                                              ? payload.error
                                              : "No se pudo seleccionar el envio."
                                          );
                                        }

                                        setSession(payload as CheckoutSessionSummary);
                                      } catch (currentError: unknown) {
                                        setError(
                                          isErrorWithMessage(currentError)
                                            ? currentError.message
                                            : "No se pudo seleccionar el envio."
                                        );
                                      } finally {
                                        setIsLoading(false);
                                      }
                                    })();
                                  }}
                                  className="mt-1 size-4"
                                />
                                <div className="min-w-0 flex-1 space-y-1 text-sm text-zinc-700">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-black">{quote.service_name}</span>
                                    <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                                      {quote.kind === "estimado" ? "Estimado" : "Real"}
                                    </span>
                                  </div>
                                  <p>
                                    {quote.delivery_type === "domicilio"
                                      ? "Entrega a domicilio"
                                      : "Retiro en sucursal"}
                                  </p>
                                  <p>
                                    {quote.eta_min_days && quote.eta_max_days
                                      ? `${quote.eta_min_days}-${quote.eta_max_days} dias habiles`
                                      : "Sin estimacion de entrega"}
                                  </p>
                                </div>
                                <span className="shrink-0 text-sm font-medium text-black">
                                  {formatCurrency(quote.amount)}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-600">
                            Por ahora no encontramos opciones de envio para esta direccion.
                          </p>
                        )}
                      </div>
                    ) : session.shipping.fulfillment_type === "pickup" ? (
                    <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                      <p className="font-medium text-black">{session.shipping.pickup_label || "Retiro en el local"}</p>
                      <p>Sin costo extra.</p>
                    </div>
                  ) : null}

                    <div className="space-y-3">
                      {session.items.map((item) => (
                        <div key={item.clave} className="flex items-start justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="font-medium text-black">{item.nombre}</p>
                            <p className="text-zinc-500">
                              x{item.cantidad}
                              {item.medida_seleccionada ? ` • ${item.medida_seleccionada}` : ""}
                            </p>
                            {item.tiene_promocion ? (
                              <p className="text-xs text-zinc-400 line-through">
                                {formatCurrency(item.precio_lista)} c/u
                              </p>
                            ) : null}
                          </div>
                          <p className="shrink-0 font-medium text-black">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">Subtotal lista</span>
                        <span className="text-black">
                          {formatCurrency(session.pricing.subtotal_lista)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">Descuentos aplicados</span>
                        <span className="text-black">
                          -{formatCurrency(session.pricing.descuentos_total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">Subtotal actual</span>
                        <span className="font-medium text-black">
                          {formatCurrency(session.pricing.subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-2">
                        <span className="text-zinc-500">Envio</span>
                        <span className="text-black">
                          {session.shipping.fulfillment_type === "pickup"
                            ? "Sin cargo"
                            : session.pricing.shipping_total !== null
                              ? formatCurrency(session.pricing.shipping_total)
                              : shippingEnabled
                                ? "Pendiente de seleccion"
                                : "No activo"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-2">
                        <span className="text-zinc-500">Total actual</span>
                        <span className="font-semibold text-black">
                          {formatCurrency(session.pricing.total || session.pricing.subtotal)}
                        </span>
                      </div>
                    </div>

                  {session.shipping.fulfillment_type === "shipping" && !session.address ? (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
                      Para continuar con envio, hace falta guardar una direccion completa.
                    </div>
                  ) : null}

                    <Button
                      type="button"
                      className="w-full"
                      disabled={
                        isLoading ||
                        (session.shipping.fulfillment_type === "shipping" && !session.address) ||
                        (shippingEnabled &&
                          session.shipping.fulfillment_type === "shipping" &&
                          session.shipping.quotes.length > 0 &&
                          !session.shipping.selected_quote)
                      }
                      onClick={() => {
                        void (async () => {
                          try {
                            setIsLoading(true);
                            setError("");
                            const response = await fetch("/api/orders/confirm", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              credentials: "same-origin",
                              body: JSON.stringify({
                                checkout_session_id: session.id_checkout_session,
                              }),
                            });
                            const payload = (await response.json()) as OrderSummary | { error?: string };

                            if (!response.ok) {
                              throw new Error(
                                "error" in payload && typeof payload.error === "string"
                                  ? payload.error
                                  : "No se pudo confirmar el pedido."
                              );
                            }

                            setConfirmedOrder(payload as OrderSummary);
                          } catch (currentError: unknown) {
                            setError(
                              isErrorWithMessage(currentError)
                                ? currentError.message
                                : "No se pudo confirmar el pedido."
                            );
                          } finally {
                            setIsLoading(false);
                          }
                        })();
                      }}
                    >
                      {isLoading ? (
                        <>
                          <LoaderCircle className="animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        "Confirmar pedido"
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600">
                    El resumen del checkout aparecera cuando el carrito y la direccion esten listos.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
