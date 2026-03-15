import { listAllProducts, listCategories } from "@/lib/catalog/service";
import { EmptyCatalogState } from "@/components/storefront/EmptyCatalogState";
import { ProductGridWithQuickView } from "@/components/storefront/ProductGridWithQuickView";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import type { Product } from "@/types/domain";

export const revalidate = 300;

interface ProductTagSection {
  label: string;
  items: Product[];
}

interface ProductCategorySection {
  id: string;
  anchorId: string;
  label: string;
  items: Product[];
}

export default async function Home() {
  const [categories, products] = await Promise.all([
    listCategories(),
    listAllProducts(),
  ]);

  const categoryNameById = categories.reduce<Record<string, string>>((accumulator, category) => {
    accumulator[category.id_categoria] = category.nombre_categoria;
    return accumulator;
  }, {});
  const tagSections = new Map<string, ProductTagSection>();
  const productsByCategoryId = new Map<string, Product[]>();
  const untaggedProducts: Product[] = [];

  for (const product of products) {
    if (product.id_categoria) {
      const categoryProducts = productsByCategoryId.get(product.id_categoria) || [];
      categoryProducts.push(product);
      productsByCategoryId.set(product.id_categoria, categoryProducts);
    }

    const tag = typeof product.tag === "string" ? product.tag.trim() : "";

    if (!tag) {
      untaggedProducts.push(product);
      continue;
    }

    const tagKey = tag.toLowerCase();
    const currentSection = tagSections.get(tagKey);

    if (currentSection) {
      currentSection.items.push(product);
      continue;
    }

    tagSections.set(tagKey, {
      label: tag,
      items: [product],
    });
  }

  const categorySections: ProductCategorySection[] = categories
    .map((category) => ({
      id: category.id_categoria,
      anchorId: `categoria-${category.slug || category.id_categoria}`,
      label: category.nombre_categoria,
      items: productsByCategoryId.get(category.id_categoria) || [],
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div
      id="inicio"
      className="min-h-screen bg-[linear-gradient(180deg,#f8f8f8_0%,#ffffff_28%,#fafafa_100%)] text-black"
    >
      <StoreHeader />

      <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-8 sm:px-6 sm:py-10">
        {products.length > 0 ? (
          <>
            {Array.from(tagSections.values()).map((section, index) => (
              <section
                key={section.label}
                id={index === 0 ? "catalogo" : undefined}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">{section.label}</h2>
                </div>

                <ProductGridWithQuickView
                  products={section.items}
                  categoryNameById={categoryNameById}
                />
              </section>
            ))}



            {categorySections.length > 0 ? (
              <section className="space-y-8">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Categorias
                  </p>
                </div>

                <div className="space-y-10">
                  {categorySections.map((section) => (
                    <section key={section.id} id={section.anchorId} className="space-y-5">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-semibold tracking-tight">{section.label}</h3>
                      </div>

                      <ProductGridWithQuickView
                        products={section.items}
                        categoryNameById={categoryNameById}
                        fallbackCategoryName={section.label}
                      />
                    </section>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section id="catalogo" className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Productos
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">Catalogo</h2>
            </div>

            <EmptyCatalogState
              title="Todavia no hay productos"
              description="Carga el primer producto desde el panel admin y se mostrara aca para los usuarios."
            />
          </section>
        )}
        {untaggedProducts.length > 0 ? (
          <section
            id={tagSections.size === 0 ? "catalogo" : undefined}
            className="space-y-5"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Productos
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">Catalogo</h2>
            </div>

            <ProductGridWithQuickView
              products={untaggedProducts}
              categoryNameById={categoryNameById}
            />
          </section>
        ) : null}
      </main>
    </div>
  );
}
