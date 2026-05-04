import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { CustomerAccountShell } from "@/components/customer/CustomerAccountShell";
import { readCustomerPageSession } from "@/lib/auth/customer-page";
import { isUserAccountsEnabled } from "@/lib/commerce-mode";
import { ensureCustomerProfile, getCustomerProfileByUid } from "@/lib/customer/service";

export default async function CustomerAccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!isUserAccountsEnabled()) {
    notFound();
  }

  const session = await readCustomerPageSession();

  if (!session) {
    redirect("/login");
  }

  const customer =
    (await getCustomerProfileByUid(session.uid)) ||
    (await ensureCustomerProfile(session.uid, {
      email: session.email ?? null,
    }));

  return <CustomerAccountShell customer={customer}>{children}</CustomerAccountShell>;
}
