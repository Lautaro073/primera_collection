import { NextResponse } from "next/server";
import { listCategoriesWithProducts } from "@/lib/catalog/service";
import { toErrorResponse } from "@/lib/api/errors";
import { stripInternalProductFields } from "@/lib/catalog/serializers";

export async function GET() {
  try {
    const categorias = await listCategoriesWithProducts();
    return NextResponse.json(
      categorias.map((categoria) => ({
        ...categoria,
        productos: categoria.productos.map(stripInternalProductFields),
      }))
    );
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener las categorias con productos");
  }
}
