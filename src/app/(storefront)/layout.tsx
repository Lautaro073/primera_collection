import type { ReactNode } from "react";
import { StoreCartProvider } from "@/components/storefront/StoreCartProvider";
import { StoreFooter } from "@/components/storefront/StoreFooter";

interface StorefrontLayoutProps {
  children: ReactNode;
}

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <StoreCartProvider>
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <StoreFooter />
      </div>
    </StoreCartProvider>
  );
}
