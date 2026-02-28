import { NextResponse } from "next/server";
import { listCategoriesWithProducts } from "@/lib/catalog/service";
import { toErrorResponse } from "@/lib/api/errors";

export async function GET() {
  try {
    const categorias = await listCategoriesWithProducts();
    return NextResponse.json(categorias);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener las categorias con productos");
  }
}
