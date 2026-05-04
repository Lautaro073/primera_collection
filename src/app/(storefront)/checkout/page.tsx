import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { readCustomerPageSession } from "@/lib/auth/customer-page";
import { listCustomerAddresses } from "@/lib/customer/address-service";
import { STOREFRONT_PAGE_SHELL_CLASSNAME } from "@/lib/storefront-shell";

export default async function CheckoutPage() {
  const session = await readCustomerPageSession();

  if (!session) {
    return null;
  }

  const addresses = await listCustomerAddresses(session.uid);

  return (
    <div className={STOREFRONT_PAGE_SHELL_CLASSNAME}>
      <StoreHeader />
      <CheckoutPageClient addresses={addresses} />
    </div>
  );
}
