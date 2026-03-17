import type { OrderSummary } from "@/types/domain";

export function formatOrderDate(value: string | null | undefined): string {
  if (!value) {
    return "Fecha no disponible";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function formatOrderItemCount(count: number): string {
  return count === 1 ? "1 producto" : `${count} productos`;
}

export function getOrderCustomerStatusLabel(order: Pick<OrderSummary, "status" | "payment_status">): string {
  if (order.status === "cancelled") {
    return "Cancelado";
  }

  if (order.payment_status === "unpaid") {
    return "Pendiente de pago";
  }

  if (order.status === "confirmed") {
    return "Confirmado";
  }

  return "Pedido creado";
}

export function getOrderCustomerTitle(order: Pick<OrderSummary, "created_at">): string {
  return `Pedido del ${formatOrderDate(order.created_at)}`;
}
