import Link from "next/link";
import {
  Instagram,
  MapPin,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { listCategoriesWithProducts } from "@/lib/catalog/service";

function normalizeWhatsappLink(phone: string): string | null {
  const normalizedPhone = phone.replace(/\D/g, "");
  return normalizedPhone ? `https://wa.me/${normalizedPhone}` : null;
}

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
  icon?: LucideIcon;
}

function FooterSection({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
        {title}
      </p>
      <ul className="space-y-2 text-sm text-zinc-600">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition hover:text-black"
              >
                {link.icon ? <link.icon className="size-4 text-zinc-400" /> : null}
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="inline-flex items-center gap-2 transition hover:text-black"
              >
                {link.icon ? <link.icon className="size-4 text-zinc-400" /> : null}
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function StoreFooter() {
  const currentYear = new Date().getFullYear();
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || "";
  const mapsUrl = process.env.NEXT_PUBLIC_MAPS_URL?.trim() || "";
  const whatsappUrl = normalizeWhatsappLink(
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.trim() || ""
  );
  const categories = await listCategoriesWithProducts();

  const shopLinks: FooterLink[] = [
    { href: "/#inicio", label: "Inicio" },
    ...categories.map((category) => ({
      href: `/#categoria-${category.slug || category.id_categoria}`,
      label: category.nombre_categoria,
    })),
  ];

  const contactLinks = [
    instagramUrl
      ? { href: instagramUrl, label: "Instagram", external: true, icon: Instagram }
      : null,
    mapsUrl
      ? { href: mapsUrl, label: "Como llegar", external: true, icon: MapPin }
      : null,
    whatsappUrl
      ? { href: whatsappUrl, label: "WhatsApp", external: true, icon: MessageCircle }
      : null,
  ].filter(
    (
      link
    ): link is {
      href: string;
      label: string;
      external: true;
      icon: LucideIcon;
    } => link !== null
  );

  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 border-b border-zinc-200 pb-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.9fr)]">
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">
              De Primera Collection
            </p>
            <h2 className="max-w-md text-2xl font-semibold tracking-tight text-black">
              Ropa, calzado y pedidos directos sin vueltas.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-zinc-600">
              Catalogo online con compra rapida por WhatsApp.
            </p>
            <p className="text-xs text-zinc-400">
              Pedidos, consultas y confirmacion final por WhatsApp.
            </p>
          </div>

          <FooterSection title="Tienda" links={shopLinks} />
          <FooterSection title="Contacto" links={contactLinks} />
        </div>

        <div className="flex flex-col gap-4 pt-5 text-sm text-zinc-500 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p>
              Copyright {currentYear}{" "}
              <a
                href="https://www.instagram.com/deprimera.collection/"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-zinc-700 transition hover:text-black"
              >
                De Primera Collection
              </a>
              . Todos los derechos reservados.
            </p>
          </div>

          <a
            href="https://wa.me/+5493865575688"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-600 transition hover:border-black hover:text-black"
          >
            Desarrollado por Lautaro Jimenez
          </a>
        </div>
      </div>
    </footer>
  );
}
