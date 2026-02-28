import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { EmptyCatalogState } from "@/components/storefront/EmptyCatalogState";
import { ProductGridWithQuickView } from "@/components/storefront/ProductGridWithQuickView";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { getCategoryProductsByName, listCategories } from "@/lib/catalog/service";
import { getCategoryHref } from "@/lib/storefront";
import type { RouteContext } from "@/types/next";

interface CategoryPageParams {
  slug: string;
}

export const dynamic = "force-dynamic";

export default async function CategoryPage(
  context: RouteContext<CategoryPageParams>
) {
  const { slug } = await context.params;
  const [categories, products] = await Promise.all([
    listCategories(),
    getCategoryProductsByName(slug),
  ]);

  const currentCategory =
    categories.find((category) => category.slug === slug) ||
    categories.find(
      (category) => category.nombre_categoria.toLowerCase() === decodeURIComponent(slug).toLowerCase()
    ) ||
    null;

  if (!currentCategory || products === null) {
    notFound();
  }

  const relatedCategories = categories.filter(
    (category) => category.id_categoria !== currentCategory.id_categoria
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-black">
      <StoreHeader />

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: currentCategory.nombre_categoria },
          ]}
        />

        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Categoria
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {currentCategory.nombre_categoria}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
            Productos disponibles dentro de esta seccion.
          </p>
        </section>

        {products.length > 0 ? (
          <ProductGridWithQuickView
            products={products}
            fallbackCategoryName={currentCategory.nombre_categoria}
            columnsClassName="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          />
        ) : (
          <EmptyCatalogState
            title="Esta categoria no tiene productos"
            description="El cliente puede ver la categoria, pero todavia no hay items cargados dentro de ella."
          />
        )}

        {relatedCategories.length > 0 ? (
          <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Otras categorias</h2>
            <div className="flex flex-wrap gap-3">
              {relatedCategories.slice(0, 6).map((category) => (
                <Link
                  key={category.id_categoria}
                  href={getCategoryHref(category)}
                  className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:border-black hover:text-black"
                >
                  {category.nombre_categoria}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
