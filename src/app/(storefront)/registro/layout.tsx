import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { readCustomerPageSession } from "@/lib/auth/customer-page";
import { isUserAccountsEnabled } from "@/lib/commerce-mode";

export default async function CustomerRegisterLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!isUserAccountsEnabled()) {
    notFound();
  }

  const session = await readCustomerPageSession();

  if (session) {
    redirect("/mi-cuenta");
  }

  return children;
}
