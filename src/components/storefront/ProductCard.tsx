import Image from "next/image";
import Link from "next/link";
import { ProductCardActions } from "@/components/storefront/ProductCardActions";
import { ProductQuickViewTrigger } from "@/components/storefront/ProductQuickViewTrigger";
import type { Product } from "@/types/domain";
import { isEcommerceEnabled } from "@/lib/commerce-mode";
import { getCloudinaryOptimizedImageUrl, isCloudinaryImageUrl } from "@/lib/images";
import { formatCurrency, getDiscountPercentage, getProductHref } from "@/lib/storefront";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  interactiveMode?: "link" | "quick-view";
}

export function ProductCard({
  product,
  categoryName,
  interactiveMode = "link",
}: ProductCardProps) {
  const productHref = getProductHref(product);
  const ecommerceEnabled = isEcommerceEnabled();
  const discountPercentage =
    ecommerceEnabled && product.tiene_promocion
      ? getDiscountPercentage(product.precio_lista, product.precio)
      : null;
  const imageSrc =
    product.imagen && isCloudinaryImageUrl(product.imagen)
      ? getCloudinaryOptimizedImageUrl(product.imagen, 720, 60)
      : product.imagen;

  const details = (
    <div className="space-y-3 p-3 text-left sm:p-4">
      <div className="space-y-1">
        {categoryName ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">
            {categoryName}
          </p>
        ) : null}
        <h3 className="text-sm font-medium text-black sm:text-base">{product.nombre}</h3>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          {ecommerceEnabled && product.tiene_promocion ? (
            <div className="space-y-0.5">
              <p className="text-[10px] text-zinc-400 line-through sm:text-xs">
                {formatCurrency(product.precio_lista)}
              </p>
              <span className="text-sm font-semibold text-black sm:text-base">
                {formatCurrency(product.precio)}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-black sm:text-base">
              {formatCurrency(product.precio)}
            </span>
          )}
          <p className="text-[10px] leading-tight text-zinc-500">Precio de contado/efectivo*</p>
        </div>
        <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 sm:text-xs">
          {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
        </span>
      </div>
    </div>
  );

  const media = (
    <div className="relative aspect-[4/4.2] overflow-hidden bg-zinc-100 sm:aspect-[4/4.4] lg:aspect-[4/3.9]">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={product.nombre}
          fill
          quality={60}
          sizes="(max-width: 639px) 58vw, (max-width: 1023px) 32vw, (max-width: 1279px) 18rem, 18rem"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#f5f5f5,#e5e5e5)] text-[10px] uppercase tracking-[0.25em] text-zinc-500 sm:text-xs">
          Sin imagen
        </div>
      )}
      {discountPercentage ? (
        <span className="absolute left-3 top-3 inline-flex rounded-full bg-black px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white sm:text-[11px]">
          -{discountPercentage}%
        </span>
      ) : null}
    </div>
  );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.05)]">
      {interactiveMode === "quick-view" ? (
        <ProductQuickViewTrigger product={product} categoryName={categoryName} className="block w-full text-left">
          {media}
          {details}
        </ProductQuickViewTrigger>
      ) : (
        <Link href={productHref} className="block text-left">
          {media}
          {details}
        </Link>
      )}

      <div className="mt-auto space-y-3 px-3 pb-3 sm:px-4 sm:pb-4">
        {interactiveMode === "link" ? (
          <Link
            href={productHref}
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:border-black hover:text-black"
          >
            Ver producto
          </Link>
        ) : (
          <ProductQuickViewTrigger
            product={product}
            categoryName={categoryName}
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:border-black hover:text-black"
          >
            Vista rapida
          </ProductQuickViewTrigger>
        )}

        <ProductCardActions product={product} />
      </div>
    </article>
  );
}
