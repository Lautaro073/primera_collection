import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { readCustomerPageSession } from "@/lib/auth/customer-page";
import { isCheckoutEnabled, isUserAccountsEnabled } from "@/lib/commerce-mode";

export default async function CheckoutLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!isCheckoutEnabled() || !isUserAccountsEnabled()) {
    notFound();
  }

  const session = await readCustomerPageSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/checkout")}`);
  }

  return children;
}
