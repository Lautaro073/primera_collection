import Link from "next/link";
import type { Category } from "@/types/domain";
import { getCategoryHref } from "@/lib/storefront";

interface CategoryPillProps {
  category: Category;
}

export function CategoryPill({ category }: CategoryPillProps) {
  return (
    <Link
      href={getCategoryHref(category)}
      className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:border-black hover:text-black"
    >
      {category.nombre_categoria}
    </Link>
  );
}
