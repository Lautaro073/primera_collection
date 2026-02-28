import { NextResponse } from "next/server";
import { listAllProducts } from "@/lib/catalog/service";
import { toErrorResponse } from "@/lib/api/errors";

export async function GET() {
  try {
    const productos = await listAllProducts();
    return NextResponse.json(productos);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener todos los productos");
  }
}
