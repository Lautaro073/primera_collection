import { OrderItemThumbnail } from "@/components/customer/OrderItemThumbnail";
import { CustomerAddressesCard } from "@/components/customer/CustomerAddressesCard";
import { CustomerProfileForm } from "@/components/customer/CustomerProfileForm";
import { listOrdersByCustomer } from "@/lib/orders/service";
import {
  formatOrderItemCount,
  getOrderCustomerStatusLabel,
  getOrderCustomerTitle,
} from "@/lib/orders/presentation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readCustomerPageSession } from "@/lib/auth/customer-page";
import { listCustomerAddresses } from "@/lib/customer/address-service";
import { ensureCustomerProfile, getCustomerProfileByUid } from "@/lib/customer/service";
import Link from "next/link";

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
  const recentOrders = (await listOrdersByCustomer(session.uid)).slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] lg:items-start">
      <div className="space-y-6">
        <CustomerProfileForm customer={customer} />
        <CustomerAddressesCard initialAddresses={addresses} />
      </div>

      <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
        <CardHeader>
          <CardTitle>Pedidos recientes</CardTitle>
          <CardDescription>
            Resumen rapido de las ultimas compras registradas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-600">
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id_orden}
                  href={`/mi-cuenta/pedidos/${order.id_orden}`}
                  className="block rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-black"
                >
                  <div className="flex items-start gap-3">
                    <OrderItemThumbnail
                      src={order.items[0]?.imagen || null}
                      alt={order.items[0]?.nombre || "Producto del pedido"}
                      size={56}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate font-medium text-black">{getOrderCustomerTitle(order)}</span>
                        <span>{getOrderCustomerStatusLabel(order)}</span>
                      </div>
                      <p className="mt-1 text-zinc-500">
                        {formatOrderItemCount(order.items.length)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p>Todavia no hay pedidos registrados.</p>
          )}

          <Link
            href="/mi-cuenta/pedidos"
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-black hover:text-black"
          >
            Ver todos los pedidos
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
