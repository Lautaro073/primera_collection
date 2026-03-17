import { OrderItemThumbnail } from "@/components/customer/OrderItemThumbnail";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readCustomerPageSession } from "@/lib/auth/customer-page";
import {
  formatOrderDate,
  getOrderCustomerStatusLabel,
  getOrderCustomerTitle,
} from "@/lib/orders/presentation";
import { getOrderByIdForCustomer } from "@/lib/orders/service";
import { formatCurrency } from "@/lib/storefront";
import type { RouteContext } from "@/types/next";

interface CustomerOrderDetailParams {
  id_orden: string;
}

export default async function CustomerOrderDetailPage(
  context: RouteContext<CustomerOrderDetailParams>,
) {
  const session = await readCustomerPageSession();

  if (!session) {
    return null;
  }

  const { id_orden } = await context.params;
  const order = await getOrderByIdForCustomer(session.uid, id_orden);

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>{getOrderCustomerTitle(order)}</CardTitle>
              <CardDescription>
                {formatOrderDate(order.created_at)} - {getOrderCustomerStatusLabel(order)}
              </CardDescription>
            </div>

            <Link
              href="/mi-cuenta/pedidos"
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-black hover:text-black"
            >
              Volver a pedidos
            </Link>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-start">
        <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>Detalle de lo incluido en el pedido.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item) => (
              <div key={item.clave} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <OrderItemThumbnail
                      src={item.imagen}
                      alt={item.nombre}
                      size={72}
                    />
                    <div className="space-y-1">
                      <p className="font-medium text-black">{item.nombre}</p>
                      <p className="text-sm text-zinc-500">
                        x{item.cantidad}
                        {item.medida_seleccionada ? ` - ${item.medida_seleccionada}` : ""}
                      </p>
                      {item.tiene_promocion ? (
                        <p className="text-xs text-zinc-400 line-through">
                          {formatCurrency(item.precio_lista)} c/u
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <p className="font-medium text-black">{formatCurrency(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Subtotal lista</span>
                <span>{formatCurrency(order.pricing.subtotal_lista)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Descuentos</span>
                <span>-{formatCurrency(order.pricing.descuentos_total)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Envio</span>
                <span>
                  {order.pricing.shipping_total !== null
                    ? formatCurrency(order.pricing.shipping_total)
                    : order.shipping.fulfillment_type === "pickup"
                      ? "Sin cargo"
                      : "Pendiente"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-2 font-medium text-black">
                <span>Total</span>
                <span>{formatCurrency(order.pricing.total || order.pricing.subtotal)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-zinc-200 shadow-none">
            <CardHeader>
              <CardTitle>Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600">
              <p>
                {order.shipping.fulfillment_type === "pickup"
                  ? order.shipping.pickup_label || "Retiro en el local"
                  : order.shipping.selected_quote?.service_name || "Envio a domicilio"}
              </p>
              {order.address ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                  <p className="font-medium text-black">{order.address.recipient_name}</p>
                  <p>{order.address.line_1}</p>
                  {order.address.line_2 ? <p>{order.address.line_2}</p> : null}
                  <p>
                    {order.address.city}, {order.address.province} - {order.address.postal_code}
                  </p>
                  <p>{order.address.phone}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
