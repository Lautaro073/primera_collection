import { NextResponse } from "next/server";
import { getProductsByTag } from "@/lib/catalog/service";
import { toErrorResponse } from "@/lib/api/errors";
import type { RouteContext } from "@/types/next";

interface ProductTagParams {
  tag: string;
}

export async function GET(_request: Request, context: RouteContext<ProductTagParams>) {
  try {
    const { tag } = await context.params;
    const productos = await getProductsByTag(tag);
    return NextResponse.json(productos);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener productos por tag");
  }
}
