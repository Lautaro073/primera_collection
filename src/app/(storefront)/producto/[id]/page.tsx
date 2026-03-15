import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductPurchasePanel } from "@/components/storefront/ProductPurchasePanel";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { getCloudinaryOptimizedImageUrl, isCloudinaryImageUrl } from "@/lib/images";
import {
  getProductById,
  listAllProducts,
  listCategories,
  listRelatedProducts,
} from "@/lib/catalog/service";
import { formatCurrency, getCategoryHref, getProductHref } from "@/lib/storefront";
import type { RouteContext } from "@/types/next";

interface ProductPageParams {
  id: string;
}

export const revalidate = 300;

export async function generateStaticParams(): Promise<ProductPageParams[]> {
  const products = await listAllProducts();

  return products.map((product) => ({
    id: product.id_producto,
  }));
}

export async function generateMetadata(
  context: RouteContext<ProductPageParams>
): Promise<Metadata> {
  const { id } = await context.params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Producto | De Primera Collection",
    };
  }

  const title = `${product.nombre} | De Primera Collection`;
  const description =
    product.descripcion ||
    `Consulta ${product.nombre} en De Primera Collection. Revisa precio, stock y talle disponible.`;

  return {
    title,
    description,
    alternates: {
      canonical: getProductHref(product),
    },
    openGraph: {
      title,
      description,
      url: getProductHref(product),
      type: "website",
      images: product.imagen
        ? [
            {
              url: product.imagen,
              alt: product.nombre,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductPage(
  context: RouteContext<ProductPageParams>
) {
  const { id } = await context.params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    listCategories(),
  ]);

  if (!product) {
    notFound();
  }

  const category =
    categories.find((item) => item.id_categoria === product.id_categoria) || null;
  const relatedProducts = await listRelatedProducts(
    product.id_producto,
    product.id_categoria,
    4
  );

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
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={
                    isCloudinaryImageUrl(product.imagen)
                      ? getCloudinaryOptimizedImageUrl(product.imagen, 1280)
                      : product.imagen
                  }
                  alt={product.nombre}
                  fill
                  quality={75}
                  priority
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
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
            </div>

            <ProductPurchasePanel product={product} className="w-full sm:w-auto" />
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
