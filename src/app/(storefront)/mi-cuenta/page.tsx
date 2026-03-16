import { CustomerAccountShell } from "@/components/customer/CustomerAccountShell";
import { CustomerAddressesCard } from "@/components/customer/CustomerAddressesCard";
import { CustomerProfileForm } from "@/components/customer/CustomerProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readCustomerPageSession } from "@/lib/auth/customer-page";
import { listCustomerAddresses } from "@/lib/customer/address-service";
import { ensureCustomerProfile, getCustomerProfileByUid } from "@/lib/customer/service";

export default async function CustomerAccountPage() {
  const session = await readCustomerPageSession();

  if (!session) {
    return null;
  }

  const customer =
    (await getCustomerProfileByUid(session.uid)) ||
    (await ensureCustomerProfile(session.uid, {
      email: session.email ?? null,
    }));
  const addresses = await listCustomerAddresses(session.uid);

  return (
    <CustomerAccountShell customer={customer}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] lg:items-start">
        <div className="space-y-6">
          <CustomerProfileForm customer={customer} />
          <CustomerAddressesCard initialAddresses={addresses} />
        </div>

        <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
          <CardHeader>
            <CardTitle>Siguientes pasos</CardTitle>
            <CardDescription>
              Esta area queda lista para crecer con direcciones, historial y checkout real.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-600">
            <p>- Direcciones guardadas</p>
            <p>- Historial de compras</p>
            <p>- Reintento de pagos</p>
            <p>- Seguimiento de ordenes</p>
          </CardContent>
        </Card>
      </div>
    </CustomerAccountShell>
  );
}
