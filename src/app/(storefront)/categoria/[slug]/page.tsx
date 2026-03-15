import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { EmptyCatalogState } from "@/components/storefront/EmptyCatalogState";
import { ProductGridWithQuickView } from "@/components/storefront/ProductGridWithQuickView";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { listCategories, listProductsByCategoryId } from "@/lib/catalog/service";
import { getCategoryHref } from "@/lib/storefront";
import type { RouteContext } from "@/types/next";

interface CategoryPageParams {
  slug: string;
}

export const revalidate = 300;

async function resolveCategory(slug: string) {
  const categories = await listCategories();
  const decodedSlug = decodeURIComponent(slug).toLowerCase();
  const currentCategory =
    categories.find((category) => category.slug === slug) ||
    categories.find(
      (category) => category.nombre_categoria.toLowerCase() === decodedSlug
    ) ||
    null;

  return {
    categories,
    currentCategory,
  };
}

export async function generateStaticParams(): Promise<CategoryPageParams[]> {
  const categories = await listCategories();

  return categories.map((category) => ({
    slug: category.slug || category.nombre_categoria,
  }));
}

export async function generateMetadata(
  context: RouteContext<CategoryPageParams>
): Promise<Metadata> {
  const { slug } = await context.params;
  const { currentCategory } = await resolveCategory(slug);

  if (!currentCategory) {
    return {
      title: "Categoria | De Primera Collection",
    };
  }

  const title = `${currentCategory.nombre_categoria} | De Primera Collection`;
  const description = `Explora ${currentCategory.nombre_categoria} en De Primera Collection. Mira precios, stock y productos disponibles de esta categoria.`;

  return {
    title,
    description,
    alternates: {
      canonical: getCategoryHref(currentCategory),
    },
    openGraph: {
      title,
      description,
      url: getCategoryHref(currentCategory),
      type: "website",
    },
  };
}

export default async function CategoryPage(
  context: RouteContext<CategoryPageParams>
) {
  const { slug } = await context.params;
  const { categories, currentCategory } = await resolveCategory(slug);

  if (!currentCategory) {
    notFound();
  }

  const products = await listProductsByCategoryId(currentCategory.id_categoria);

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
            columnsClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
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


