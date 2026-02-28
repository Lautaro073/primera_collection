import Link from "next/link";
import { listAllProducts, listCategories } from "@/lib/catalog/service";
import { CategoryPill } from "@/components/storefront/CategoryPill";
import { EmptyCatalogState } from "@/components/storefront/EmptyCatalogState";
import { ProductGridWithQuickView } from "@/components/storefront/ProductGridWithQuickView";
import { StoreHeader } from "@/components/storefront/StoreHeader";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, products] = await Promise.all([
    listCategories(),
    listAllProducts(),
  ]);

  const latestProducts = products.slice(0, 8);
  const categoryNameById = Object.fromEntries(
    categories.map((category) => [category.id_categoria, category.nombre_categoria])
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f8f8_0%,#ffffff_28%,#fafafa_100%)] text-black">
      <StoreHeader />

      <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-8 sm:px-6 sm:py-10">
        {/* <section className="grid gap-8 rounded-[2rem] border border-zinc-200 bg-[linear-gradient(135deg,#ffffff_0%,#f6f6f6_55%,#ececec_100%)] p-6 sm:p-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
              Tienda
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Catalogo limpio, rapido y listo para comprar.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
              El backend ya esta migrado a Next y Firebase. Esta etapa deja lista
              la experiencia publica para navegar categorias y productos.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="#catalogo"
                className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Ver destacados
              </Link>
              <Link
                href="#categorias"
                className="inline-flex rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-black transition hover:border-black"
              >
                Explorar categorias
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                Categorias activas
              </p>
              <p className="mt-3 text-3xl font-semibold">{categories.length}</p>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-black p-5 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">
                Productos cargados
              </p>
              <p className="mt-3 text-3xl font-semibold">{products.length}</p>
            </div>
          </div>
        </section> */}

        <section id="categorias" className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Categorias
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">Navega por seccion</h2>
          </div>

          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <CategoryPill key={category.id_categoria} category={category} />
              ))}
            </div>
          ) : (
            <EmptyCatalogState
              title="Todavia no hay categorias"
              description="Cuando cargues categorias desde el panel admin, van a aparecer aca automaticamente."
            />
          )}
        </section>

        <section id="catalogo" className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Productos
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">Ultimos ingresos</h2>
            </div>
          </div>

          {latestProducts.length > 0 ? (
            <ProductGridWithQuickView
              products={latestProducts}
              categoryNameById={categoryNameById}
            />
          ) : (
            <EmptyCatalogState
              title="Todavia no hay productos"
              description="Carga el primer producto desde el panel admin y se mostrara aca para los usuarios."
            />
          )}
        </section>
      </main>
    </div>
  );
}
