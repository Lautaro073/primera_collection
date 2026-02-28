import { NextResponse } from "next/server";
import { createProduct, listProducts } from "@/lib/catalog/service";
import { requireAdmin } from "@/lib/auth/admin";
import { toErrorResponse } from "@/lib/api/errors";
import { parseCatalogRequest } from "@/lib/catalog/request";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 15);
    const offset = Number(searchParams.get("offset") ?? 0);
    const productos = await listProducts({ limit, offset });

    return NextResponse.json(productos);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener los productos");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const { payload, images } = await parseCatalogRequest(request);
    const producto = await createProduct(payload, images);

    return NextResponse.json(producto, { status: 201 });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al crear el producto");
  }
}
