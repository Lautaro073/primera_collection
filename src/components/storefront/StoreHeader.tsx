import Link from "next/link";

export function StoreHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-black">
          Primera Collection
        </Link>
        <nav className="flex items-center gap-5 text-sm text-zinc-600">
          <Link href="/" className="transition hover:text-black">
            Inicio
          </Link>
        </nav>
      </div>
    </header>
  );
}
