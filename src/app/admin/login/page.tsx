"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { type Auth, onIdTokenChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { isErrorWithMessage } from "@/types/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFirebaseClientAuth } from "@/lib/firebase/auth";
import { getAdminSession } from "@/lib/admin/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState<Auth | null>(null);
  const [booting, setBooting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

          const session = await getAdminSession(authInstance, user);

          if (!session) {
            await signOut(authInstance);
            setError("Tu usuario existe, pero no tiene el claim admin.");
            setBooting(false);
            return;
          }

          router.replace("/admin/catalogo");
        });
      } catch (currentError: unknown) {
        setError(
          isErrorWithMessage(currentError)
            ? currentError.message
            : "No se pudo inicializar el login."
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
      const credentials = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const session = await getAdminSession(auth, credentials.user);

      if (!session) {
        await signOut(auth);
        setError("El usuario inicio sesion, pero no tiene permisos de administrador.");
        return;
      }

      router.replace("/admin/catalogo");
    } catch {
      setError("No se pudo iniciar sesion. Revisa email, password.");
    } finally {
      setIsSubmitting(false);
      setBooting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-8">
      <section className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white p-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Acceso admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-black">Iniciar sesion</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Ingresar con un usuario existente de Firebase.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <Input
              className="border-zinc-300"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@tu-dominio.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Password</span>
            <Input
              className="border-zinc-300"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <div className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={booting || isSubmitting}
            aria-busy={booting || isSubmitting}
          >
            {booting || isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" />
                Validando...
              </>
            ) : (
              "Iniciar Sesion"
            )}
          </Button>
        </form>
      </section>
    </main>
  );
}
