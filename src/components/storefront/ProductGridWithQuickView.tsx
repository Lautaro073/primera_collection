import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductGridCarouselClient } from "@/components/storefront/ProductGridCarouselClient";
import { isEcommerceEnabled } from "@/lib/commerce-mode";
import type { Product } from "@/types/domain";

interface ProductGridWithQuickViewProps {
  products: Product[];
  categoryNameById?: Record<string, string>;
  fallbackCategoryName?: string;
  columnsClassName?: string;
}

export function ProductGridWithQuickView({
  products,
  categoryNameById,
  fallbackCategoryName,
  columnsClassName = "",
}: ProductGridWithQuickViewProps) {
  const interactiveMode = isEcommerceEnabled() ? "link" : "quick-view";

  return (
    <ProductGridCarouselClient columnsClassName={columnsClassName}>
      {products.map((product) => (
        <div
          key={product.id_producto}
          className="w-[14.5rem] shrink-0 snap-start sm:w-[15.5rem] lg:w-[17rem] xl:w-[18rem]"
        >
          <ProductCard
            product={product}
            categoryName={
              fallbackCategoryName ||
              (product.id_categoria ? categoryNameById?.[product.id_categoria] : undefined)
            }
            interactiveMode={interactiveMode}
          />
        </div>
      ))}
    </ProductGridCarouselClient>
  );
}
