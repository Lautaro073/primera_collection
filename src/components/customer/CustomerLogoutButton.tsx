"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { clearCustomerSession } from "@/lib/customer/client";
import { getFirebaseClientAuth } from "@/lib/firebase/auth";

export function CustomerLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout(): void {
    startTransition(() => {
      void (async () => {
        const auth = await getFirebaseClientAuth();
        await clearCustomerSession();
        await signOut(auth);
        router.replace("/");
        router.refresh();
      })();
    });
  }

  return (
    <Button type="button" variant="outline" onClick={handleLogout} disabled={isPending}>
      <LogOut />
      {isPending ? "Cerrando..." : "Cerrar sesion"}
    </Button>
  );
}
