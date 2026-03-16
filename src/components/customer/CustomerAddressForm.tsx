"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LoaderCircle, Save, X } from "lucide-react";
import type { CustomerAddress, CustomerAddressLabel } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isErrorWithMessage } from "@/types/shared";

interface CustomerAddressFormProps {
  initialAddress?: CustomerAddress | null;
  onCancel: () => void;
  onSaved: (address: CustomerAddress) => void;
}

interface CustomerAddressFormState {
  city: string;
  deliveryNotes: string;
  isDefault: boolean;
  label: CustomerAddressLabel;
  line1: string;
  line2: string;
  phone: string;
  postalCode: string;
  province: string;
  recipientName: string;
}

function buildInitialState(address?: CustomerAddress | null): CustomerAddressFormState {
  return {
    city: address?.city || "",
    deliveryNotes: address?.delivery_notes || "",
    isDefault: address?.is_default || false,
    label: address?.label || "casa",
    line1: address?.line_1 || "",
    line2: address?.line_2 || "",
    phone: address?.phone || "",
    postalCode: address?.postal_code || "",
    province: address?.province || "",
    recipientName: address?.recipient_name || "",
  };
}

export function CustomerAddressForm({
  initialAddress = null,
  onCancel,
  onSaved,
}: CustomerAddressFormProps) {
  const [form, setForm] = useState<CustomerAddressFormState>(buildInitialState(initialAddress));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = useMemo(() => Boolean(initialAddress), [initialAddress]);

  useEffect(() => {
    setForm(buildInitialState(initialAddress));
    setError("");
  }, [initialAddress]);

  function updateField(field: keyof CustomerAddressFormState, value: string | boolean): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const endpoint = initialAddress
        ? `/api/me/addresses/${initialAddress.id}`
        : "/api/me/addresses";
      const method = initialAddress ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as CustomerAddress | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "No se pudo guardar la direccion."
        );
      }

      onSaved(payload as CustomerAddress);
    } catch (currentError: unknown) {
      setError(
        isErrorWithMessage(currentError)
          ? currentError.message
          : "No se pudo guardar la direccion."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-black">
            {isEditing ? "Editar direccion" : "Nueva direccion"}
          </p>
          <p className="text-sm text-zinc-500">
            Guarda direcciones listas para usar en checkout.
          </p>
        </div>

        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X />
          <span className="sr-only">Cerrar formulario</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer-address-label">Etiqueta</Label>
          <select
            id="customer-address-label"
            value={form.label}
            onChange={(event) => updateField("label", event.target.value as CustomerAddressLabel)}
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-black shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-zinc-200"
          >
            <option value="casa">Casa</option>
            <option value="trabajo">Trabajo</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-address-recipient">Destinatario</Label>
          <Input
            id="customer-address-recipient"
            value={form.recipientName}
            onChange={(event) => updateField("recipientName", event.target.value)}
            placeholder="Nombre de quien recibe"
            autoComplete="shipping name"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer-address-phone">Telefono</Label>
          <Input
            id="customer-address-phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            autoComplete="tel"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-address-postal-code">Codigo postal</Label>
          <Input
            id="customer-address-postal-code"
            value={form.postalCode}
            onChange={(event) => updateField("postalCode", event.target.value)}
            inputMode="numeric"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-address-line1">Direccion principal</Label>
        <Input
          id="customer-address-line1"
          value={form.line1}
          onChange={(event) => updateField("line1", event.target.value)}
          placeholder="Calle, numero, piso, depto"
          autoComplete="address-line1"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-address-line2">Complemento</Label>
        <Input
          id="customer-address-line2"
          value={form.line2}
          onChange={(event) => updateField("line2", event.target.value)}
          placeholder="Barrio, torre, referencia"
          autoComplete="address-line2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer-address-city">Ciudad</Label>
          <Input
            id="customer-address-city"
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
            autoComplete="address-level2"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-address-province">Provincia</Label>
          <Input
            id="customer-address-province"
            value={form.province}
            onChange={(event) => updateField("province", event.target.value)}
            autoComplete="address-level1"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-address-notes">Notas de entrega</Label>
        <Textarea
          id="customer-address-notes"
          value={form.deliveryNotes}
          onChange={(event) => updateField("deliveryNotes", event.target.value)}
          placeholder="Indicaciones utiles para la entrega"
        />
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(event) => updateField("isDefault", event.target.checked)}
          className="size-4 rounded border-zinc-300"
        />
        Usar como direccion predeterminada
      </label>

      {error ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save />
              {isEditing ? "Actualizar direccion" : "Guardar direccion"}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
