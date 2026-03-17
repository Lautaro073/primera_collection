"use client";

import { useMemo, useState } from "react";
import { Check, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import type { CustomerAddress } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerAddressForm } from "@/components/customer/CustomerAddressForm";
import { isErrorWithMessage } from "@/types/shared";

interface CustomerAddressesCardProps {
  initialAddresses: CustomerAddress[];
}

function sortAddresses(addresses: CustomerAddress[]): CustomerAddress[] {
  return [...addresses].sort((left, right) => {
    if (left.is_default && !right.is_default) {
      return -1;
    }

    if (!left.is_default && right.is_default) {
      return 1;
    }

    return (right.updated_at || "").localeCompare(left.updated_at || "");
  });
}

export function CustomerAddressesCard({ initialAddresses }: CustomerAddressesCardProps) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>(() => sortAddresses(initialAddresses));
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [busyAddressId, setBusyAddressId] = useState("");
  const hasAddresses = useMemo(() => addresses.length > 0, [addresses.length]);

  function handleSaved(address: CustomerAddress): void {
    setAddresses((current) => {
      const withoutCurrent = current.filter((item) => item.id !== address.id);
      const nextAddresses = address.is_default
        ? withoutCurrent.map((item) => ({ ...item, is_default: false }))
        : withoutCurrent;

      return sortAddresses([...nextAddresses, address]);
    });
    setEditingAddress(null);
    setShowForm(false);
    setError("");
  }

  async function handleDelete(addressId: string): Promise<void> {
    setBusyAddressId(addressId);
    setError("");

    try {
      const response = await fetch(`/api/me/addresses/${addressId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const payload = (await response.json()) as
        | { deleted: true; addresses: CustomerAddress[] }
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "No se pudo eliminar la direccion."
        );
      }

      setAddresses(sortAddresses((payload as { deleted: true; addresses: CustomerAddress[] }).addresses));
    } catch (currentError: unknown) {
      setError(
        isErrorWithMessage(currentError)
          ? currentError.message
          : "No se pudo eliminar la direccion."
      );
    } finally {
      setBusyAddressId("");
    }
  }

  async function handleSetDefault(addressId: string): Promise<void> {
    setBusyAddressId(addressId);
    setError("");

    try {
      const response = await fetch(`/api/me/addresses/${addressId}/default`, {
        method: "PUT",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as CustomerAddress | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "No se pudo actualizar la direccion predeterminada."
        );
      }

      handleSaved(payload as CustomerAddress);
    } catch (currentError: unknown) {
      setError(
        isErrorWithMessage(currentError)
          ? currentError.message
          : "No se pudo actualizar la direccion predeterminada."
      );
    } finally {
      setBusyAddressId("");
    }
  }

  return (
    <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Direcciones</CardTitle>
            <CardDescription>
              Añade tus direcciones para los envios.
            </CardDescription>
          </div>

          {!showForm ? (
            <Button type="button" variant="outline" onClick={() => setShowForm(true)}>
              <Plus />
              Agregar direccion
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm ? (
          <CustomerAddressForm
            initialAddress={editingAddress}
            onCancel={() => {
              setEditingAddress(null);
              setShowForm(false);
            }}
            onSaved={handleSaved}
          />
        ) : null}

        {error ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
            {error}
          </div>
        ) : null}

        {hasAddresses ? (
          <div className="space-y-3">
            {addresses.map((address) => (
              <article
                key={address.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                        {address.label}
                      </span>
                      {address.is_default ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-white">
                          <Check className="size-3" />
                          Predeterminada
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1 text-sm text-zinc-700">
                      <p className="font-medium text-black">{address.recipient_name}</p>
                      <p>{address.line_1}</p>
                      {address.line_2 ? <p>{address.line_2}</p> : null}
                      <p>
                        {address.city}, {address.province} - {address.postal_code}
                      </p>
                      <p>{address.phone}</p>
                      {address.delivery_notes ? (
                        <p className="text-zinc-500">{address.delivery_notes}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {!address.is_default ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyAddressId === address.id}
                        onClick={() => void handleSetDefault(address.id)}
                      >
                        <MapPin />
                        Predeterminada
                      </Button>
                    ) : null}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAddress(address);
                        setShowForm(true);
                      }}
                    >
                      <Pencil />
                      Editar
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyAddressId === address.id}
                      onClick={() => void handleDelete(address.id)}
                    >
                      <Trash2 />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-10 text-center text-sm text-zinc-600">
            Sin direcciones guardadas. Agregar una direccion deja la cuenta lista para checkout.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
