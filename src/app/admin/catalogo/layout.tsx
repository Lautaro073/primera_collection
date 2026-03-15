import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { readAdminPageSession } from "@/lib/auth/admin-page";

export default async function AdminCatalogLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await readAdminPageSession();

  if (!session) {
    redirect("/admin/login");
  }

  return children;
}
