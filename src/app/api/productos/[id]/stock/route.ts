import { NextResponse } from "next/server";
import { getProductStockById } from "@/lib/catalog/service";
import { toErrorResponse } from "@/lib/api/errors";
import type { RouteContext } from "@/types/next";

interface ProductStockParams {
  id: string;
}

export async function GET(_request: Request, context: RouteContext<ProductStockParams>) {
  try {
    const { id } = await context.params;
    const stock = await getProductStockById(id);

    if (!stock) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(stock);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener el stock");
  }
}
