import { NextResponse } from "next/server";
import { createCategory, listCategories } from "@/lib/catalog/service";
import { requireAdmin } from "@/lib/auth/admin";
import { toErrorResponse } from "@/lib/api/errors";

export async function GET() {
  try {
    const categorias = await listCategories();
    return NextResponse.json(categorias);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener las categorias");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const categoria = await createCategory(payload);

    return NextResponse.json(categoria, { status: 201 });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al crear la categoria");
  }
}
