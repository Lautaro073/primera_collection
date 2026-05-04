import Link from "next/link";
import type { ReactNode } from "react";
import type { CustomerProfile } from "@/types/domain";
import { CustomerLogoutButton } from "@/components/customer/CustomerLogoutButton";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { STOREFRONT_PAGE_SHELL_CLASSNAME } from "@/lib/storefront-shell";

interface CustomerAccountShellProps {
  children: ReactNode;
  customer: CustomerProfile;
}

export function CustomerAccountShell({ children, customer }: CustomerAccountShellProps) {
  const fullName = `${customer.first_name} ${customer.last_name}`.trim();

  return (
    <div className={STOREFRONT_PAGE_SHELL_CLASSNAME}>
      <StoreHeader />
      <main className="px-4 py-8 text-black sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  Mi cuenta
                </p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {fullName || customer.email || "Perfil de cliente"}
                </h1>
                <p className="text-sm text-zinc-600">
                  {customer.email || "Email no disponible"}
                </p>
              </div>

              <CustomerLogoutButton />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/mi-cuenta"
                className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-black hover:text-black"
              >
                Perfil
              </Link>
              <Link
                href="/mi-cuenta/pedidos"
                className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-black hover:text-black"
              >
                Pedidos
              </Link>
            </div>
          </section>

          {children}
        </div>
      </main>
    </div>
  );
}
