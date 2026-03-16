"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { type Auth, onIdTokenChanged, signInWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebaseClientAuth } from "@/lib/firebase/auth";
import { persistCustomerSession } from "@/lib/customer/client";
import { isErrorWithMessage } from "@/types/shared";

export function CustomerLoginForm() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [booting, setBooting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

          await persistCustomerSession(user);
          router.replace("/mi-cuenta");
        });
      } catch (currentError: unknown) {
        setError(
          isErrorWithMessage(currentError)
            ? currentError.message
            : "No se pudo inicializar el acceso de clientes."
        );
        setBooting(false);
      }
    })();

    return () => unsubscribe();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");

    if (!auth) {
      setError("Firebase Auth todavia no esta listo.");
      return;
    }

    setIsSubmitting(true);

    try {
      const credentials = await signInWithEmailAndPassword(auth, email.trim(), password);
      await persistCustomerSession(credentials.user);
      router.replace("/mi-cuenta");
    } catch {
      setError("No se pudo iniciar sesion. Revisa email y password.");
    } finally {
      setIsSubmitting(false);
      setBooting(false);
    }
  }

  return (
    <Card className="w-full max-w-md rounded-[1.75rem] border-zinc-200 shadow-none">
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
          Acceso cliente
        </p>
        <CardTitle>Iniciar sesion</CardTitle>
        <CardDescription>
          Acceso a perfil, direcciones y futuras compras.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="customer-login-email">Email</Label>
            <Input
              id="customer-login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@dominio.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-login-password">Contraseña</Label>
            <Input
              id="customer-login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contrasena"
              autoComplete="current-password"
              required
            />
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
                Validando...
              </>
            ) : (
              "Iniciar sesion"
            )}
          </Button>

          <div className="text-center text-sm text-zinc-600">
            <Link href="/registro" className="font-medium text-black underline underline-offset-4">
              Crear cuenta nueva
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
