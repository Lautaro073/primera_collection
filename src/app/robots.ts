import type { MetadataRoute } from "next";
import { getSiteUrl, shouldIndexSite } from "@/lib/site";

const appUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  const shouldIndex = shouldIndexSite();

  return {
    rules: {
      userAgent: "*",
      allow: shouldIndex ? "/" : "",
      disallow: shouldIndex ? undefined : "/",
    },
    sitemap: shouldIndex ? `${appUrl}/sitemap.xml` : undefined,
    host: shouldIndex ? appUrl : undefined,
  };
}
