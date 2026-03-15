import { NextResponse } from "next/server";
import { listAllProducts } from "@/lib/catalog/service";
import { requireAdmin } from "@/lib/auth/admin";
import { toErrorResponse } from "@/lib/api/errors";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const productos = await listAllProducts();
    return NextResponse.json(productos);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener todos los productos");
  }
}
