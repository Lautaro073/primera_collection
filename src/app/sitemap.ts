import type { MetadataRoute } from "next";
import { listAllProducts, listCategories } from "@/lib/catalog/service";
import { getCategoryHref, getProductHref } from "@/lib/storefront";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([listCategories(), listAllProducts()]);

  return [
    {
      url: appUrl,
      changeFrequency: "hourly",
      priority: 1,
    },
    ...categories.map((category) => ({
      url: `${appUrl}${getCategoryHref(category)}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${appUrl}${getProductHref(product)}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
