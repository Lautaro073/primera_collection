import { NextResponse } from "next/server";
import { getCategoryProductsByName } from "@/lib/catalog/service";
import { toErrorResponse } from "@/lib/api/errors";
import type { RouteContext } from "@/types/next";

interface CategoryNameParams {
  nombre: string;
}

export async function GET(_request: Request, context: RouteContext<CategoryNameParams>) {
  try {
    const { nombre } = await context.params;
    const productos = await getCategoryProductsByName(decodeURIComponent(nombre));

    if (!productos) {
      return NextResponse.json(
        { error: "No se encontraron productos para esta categoria" },
        { status: 404 }
      );
    }

    return NextResponse.json(productos);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener productos por categoria");
  }
}
