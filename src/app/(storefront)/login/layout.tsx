import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isUserAccountsEnabled } from "@/lib/commerce-mode";

export default async function CustomerLoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!isUserAccountsEnabled()) {
    notFound();
  }

  return children;
}
