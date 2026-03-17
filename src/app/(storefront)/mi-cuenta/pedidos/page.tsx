import { OrderItemThumbnail } from "@/components/customer/OrderItemThumbnail";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readCustomerPageSession } from "@/lib/auth/customer-page";
import {
  formatOrderDate,
  formatOrderItemCount,
  getOrderCustomerTitle,
} from "@/lib/orders/presentation";
import { listOrdersByCustomer } from "@/lib/orders/service";
import { formatCurrency } from "@/lib/storefront";

export default async function CustomerOrdersPage() {
  const session = await readCustomerPageSession();

  if (!session) {
    return null;
  }

  const orders = await listOrdersByCustomer(session.uid);

  return (
    <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
      <CardHeader>
        <CardTitle>Pedidos</CardTitle>
        <CardDescription>Historial de compras registradas en la cuenta.</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id_orden}
                href={`/mi-cuenta/pedidos/${order.id_orden}`}
                className="block rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 transition hover:border-black"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <OrderItemThumbnail
                      src={order.items[0]?.imagen || null}
                      alt={order.items[0]?.nombre || "Producto del pedido"}
                      size={64}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-black">{getOrderCustomerTitle(order)}</p>
                      <p className="text-sm text-zinc-500">
                        {formatOrderDate(order.created_at)} - {formatOrderItemCount(order.items.length)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm sm:text-right">
                    <p className="font-medium text-black">
                      {formatCurrency(order.pricing.total || order.pricing.subtotal)}
                    </p>
                    <p className="text-zinc-500">
                      {order.shipping.fulfillment_type === "pickup"
                        ? "Retiro en el local"
                        : order.shipping.selected_quote?.service_name || "Envio pendiente"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-10 text-center text-sm text-zinc-600">
            Todavia no hay pedidos registrados.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
