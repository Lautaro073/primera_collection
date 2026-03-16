"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { createUserWithEmailAndPassword, type Auth, onIdTokenChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebaseClientAuth } from "@/lib/firebase/auth";
import { persistCustomerSession, registerCustomerAccount } from "@/lib/customer/client";
import { isErrorWithMessage } from "@/types/shared";

export function CustomerRegisterForm() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [booting, setBooting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dni: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const isCreatingAccountRef = useRef(false);

  useEffect(() => {
    let unsubscribe: () => void = () => undefined;

    void (async () => {
      try {
        const authInstance = await getFirebaseClientAuth();
        setAuth(authInstance);

        unsubscribe = onIdTokenChanged(authInstance, async (user) => {
          if (!user) {
            setBooting(false);
            return;
          }

          if (isCreatingAccountRef.current) {
            return;
          }

          await persistCustomerSession(user);
          router.replace("/mi-cuenta");
        });
      } catch (currentError: unknown) {
        setError(
          isErrorWithMessage(currentError)
            ? currentError.message
            : "No se pudo inicializar el registro."
        );
        setBooting(false);
      }
    })();

    return () => unsubscribe();
  }, [router]);

  function updateField(field: keyof typeof form, value: string): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");

    if (!auth) {
      setError("Firebase Auth todavia no esta listo.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("La confirmacion de password no coincide.");
      return;
    }

    setIsSubmitting(true);
    isCreatingAccountRef.current = true;

    try {
      const credentials = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      await registerCustomerAccount(credentials.user, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        dni: form.dni,
      });

      router.replace("/mi-cuenta");
    } catch {
      setError("No se pudo crear la cuenta. Revisa los datos e intenta de nuevo.");
    } finally {
      isCreatingAccountRef.current = false;
      setIsSubmitting(false);
      setBooting(false);
    }
  }

  return (
    <Card className="w-full max-w-xl rounded-[1.75rem] border-zinc-200 shadow-none">
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
          Cuenta cliente
        </p>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>
          Registra tus datos para guardar tu perfil y preparar el modo e-commerce.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-register-first-name">Nombre</Label>
              <Input
                id="customer-register-first-name"
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                placeholder="Tu nombre"
                autoComplete="given-name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-register-last-name">Apellido</Label>
              <Input
                id="customer-register-last-name"
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                placeholder="Tu apellido"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-register-phone">Telefono</Label>
              <Input
                id="customer-register-phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="3815555555"
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-register-dni">DNI</Label>
              <Input
                id="customer-register-dni"
                value={form.dni}
                onChange={(event) => updateField("dni", event.target.value)}
                placeholder="Solo numeros"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-register-email">Email</Label>
            <Input
              id="customer-register-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-register-password">Password</Label>
              <Input
                id="customer-register-password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Minimo 6 caracteres"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-register-confirm-password">Confirmar password</Label>
              <Input
                id="customer-register-confirm-password"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                placeholder="Repite tu password"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={booting || isSubmitting}>
            {booting || isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" />
                Creando cuenta...
              </>
            ) : (
              "Crear cuenta"
            )}
          </Button>

          <p className="text-center text-sm text-zinc-600">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-black underline underline-offset-4">
              Iniciar sesion
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
