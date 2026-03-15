import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/catalog/service";
import { toErrorResponse } from "@/lib/api/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("search");
  const rawLimit = Number(searchParams.get("limit") ?? "6");
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.trunc(rawLimit) : 6;

  if (!term) {
    return NextResponse.json(
      { error: "Debe proporcionar un termino de busqueda." },
      { status: 400 }
    );
  }

  try {
    const productos = await searchProducts(term, { limit });
    return NextResponse.json(productos);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al buscar los productos");
  }
}
