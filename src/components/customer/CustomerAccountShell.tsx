import type { ReactNode } from "react";
import type { CustomerProfile } from "@/types/domain";
import { CustomerLogoutButton } from "@/components/customer/CustomerLogoutButton";

interface CustomerAccountShellProps {
  children: ReactNode;
  customer: CustomerProfile;
}

export function CustomerAccountShell({ children, customer }: CustomerAccountShellProps) {
  const fullName = `${customer.first_name} ${customer.last_name}`.trim();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-black sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Mi cuenta
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {fullName || customer.email || "Tu perfil"}
              </h1>
              <p className="text-sm text-zinc-600">
                {customer.email || "Email no disponible"}
              </p>
            </div>

            <CustomerLogoutButton />
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
