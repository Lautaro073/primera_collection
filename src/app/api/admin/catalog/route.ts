import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/admin";
import { listAllProducts, listCategories } from "@/lib/catalog/service";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const [categories, products] = await Promise.all([
      listCategories(),
      listAllProducts(),
    ]);

    return NextResponse.json({ categories, products });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al cargar el catalogo admin");
  }
}
