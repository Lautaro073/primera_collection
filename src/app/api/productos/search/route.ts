import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/catalog/service";
import { toErrorResponse } from "@/lib/api/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("search");

  if (!term) {
    return NextResponse.json(
      { error: "Debe proporcionar un termino de busqueda." },
      { status: 400 }
    );
  }

  try {
    const productos = await searchProducts(term);
    return NextResponse.json(productos);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al buscar los productos");
  }
}
