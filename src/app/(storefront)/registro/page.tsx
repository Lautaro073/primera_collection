import { redirect } from "next/navigation";
import { CustomerRegisterForm } from "@/components/customer/CustomerRegisterForm";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { readCustomerPageSession } from "@/lib/auth/customer-page";
import {
  DEFAULT_CUSTOMER_REDIRECT_PATH,
  resolveCustomerNextPath,
} from "@/lib/customer/navigation";
import { STOREFRONT_PAGE_SHELL_CLASSNAME } from "@/lib/storefront-shell";

interface CustomerRegisterPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function CustomerRegisterPage({
  searchParams,
}: CustomerRegisterPageProps) {
  const session = await readCustomerPageSession();
  const resolvedSearchParams = await searchParams;
  const nextPath = resolveCustomerNextPath(resolvedSearchParams.next);

  if (session) {
    redirect(nextPath || DEFAULT_CUSTOMER_REDIRECT_PATH);
  }

  return (
    <div className={STOREFRONT_PAGE_SHELL_CLASSNAME}>
      <StoreHeader />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-6xl justify-center">
          <CustomerRegisterForm nextPath={nextPath} />
        </div>
      </main>
    </div>
  );
}
