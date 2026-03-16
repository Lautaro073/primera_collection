"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import type { CustomerProfile } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isErrorWithMessage } from "@/types/shared";

interface CustomerProfileFormProps {
  customer: CustomerProfile;
}

export function CustomerProfileForm({ customer }: CustomerProfileFormProps) {
  const [form, setForm] = useState({
    firstName: customer.first_name,
    lastName: customer.last_name,
    phone: customer.phone,
    dni: customer.dni,
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as CustomerProfile | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "No se pudo actualizar el perfil."
        );
      }

      const customer = payload as CustomerProfile;

      setForm({
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        dni: customer.dni,
      });
      setNotice("Perfil actualizado correctamente.");
    } catch (currentError: unknown) {
      setError(
        isErrorWithMessage(currentError)
          ? currentError.message
          : "No se pudo actualizar el perfil."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>
          Edita tus datos basicos para preparar futuras compras y envios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-profile-first-name">Nombre</Label>
              <Input
                id="customer-profile-first-name"
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-profile-last-name">Apellido</Label>
              <Input
                id="customer-profile-last-name"
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-profile-phone">Telefono</Label>
              <Input
                id="customer-profile-phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-profile-dni">DNI</Label>
              <Input
                id="customer-profile-dni"
                value={form.dni}
                onChange={(event) => updateField("dni", event.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          {notice ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save />
                Guardar perfil
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
