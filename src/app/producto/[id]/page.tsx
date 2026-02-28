/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { getProductById, listAllProducts, listCategories } from "@/lib/catalog/service";
import { formatCurrency, getCategoryHref } from "@/lib/storefront";
import type { RouteContext } from "@/types/next";

interface ProductPageParams {
  id: string;
}

export const dynamic = "force-dynamic";

export default async function ProductPage(
  context: RouteContext<ProductPageParams>
) {
  const { id } = await context.params;
  const [product, categories, allProducts] = await Promise.all([
    getProductById(id),
    listCategories(),
    listAllProducts(),
  ]);

  if (!product) {
    notFound();
  }

  const category =
    categories.find((item) => item.id_categoria === product.id_categoria) || null;
  const relatedProducts = allProducts
    .filter((item) => item.id_producto !== product.id_producto)
    .filter((item) => item.id_categoria === product.id_categoria)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-zinc-50 text-black">
      <StoreHeader />

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            ...(category
              ? [{ label: category.nombre_categoria, href: getCategoryHref(category) }]
              : []),
            { label: product.nombre },
          ]}
        />

        <section className="grid gap-8 rounded-[2rem] border border-zinc-200 bg-white p-6 sm:p-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100">
            {product.imagen ? (
              <img
                src={product.imagen}
                alt={product.nombre}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center bg-[linear-gradient(135deg,#f5f5f5,#e5e5e5)] text-xs uppercase tracking-[0.25em] text-zinc-500">
                Sin imagen
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-5">
              {category ? (
                <Link
                  href={getCategoryHref(category)}
                  className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-600 transition hover:border-black hover:text-black"
                >
                  {category.nombre_categoria}
                </Link>
              ) : null}

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {product.nombre}
                </h1>
                <p className="text-2xl font-semibold">
                  {formatCurrency(product.precio)}
                </p>
              </div>

              <p className="text-sm leading-7 text-zinc-600">
                {product.descripcion || "Sin descripcion cargada por el momento."}
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Stock</p>
                <p className="mt-2 text-base font-medium text-black">
                  {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Etiqueta</p>
                <p className="mt-2 text-base font-medium text-black">
                  {product.tag || "Sin etiqueta"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  {product.tipo_medida === "calzado" ? "Numeros disponibles" : "Talles disponibles"}
                </p>
                <p className="mt-2 text-base font-medium text-black">
                  {product.medidas.length > 0
                    ? product.medidas.join(", ")
                    : "No aplica para este producto"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {relatedProducts.length > 0 ? (
          <section className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Relacionados
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Mas productos de esta categoria
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item.id_producto}
                  product={item}
                  categoryName={category?.nombre_categoria}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
