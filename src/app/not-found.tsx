import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-black sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-[2rem] border border-zinc-200 bg-white p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Error 404
        </p>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            No encontramos la pagina que buscabas
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
            Puede que el enlace haya cambiado o que el producto ya no este disponible.
            Puedes volver al inicio o seguir navegando por las categorias.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Volver al inicio
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition hover:border-black hover:text-black"
          >
            Ver productos
          </Link>
        </div>
      </div>
    </main>
  );
}
