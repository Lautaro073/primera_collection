export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ffffff,_#e9f2ff_45%,_#d5e8ff)] px-6 py-16 text-zinc-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 rounded-3xl border border-white/70 bg-white/85 p-8 shadow-[0_20px_80px_rgba(20,50,90,0.12)] backdrop-blur">
        <section className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">
            Etapa 1
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">
            Backend base migrado a Next.js con Firebase para catalogo.
          </h1>
          <p className="max-w-3xl text-base leading-7 text-zinc-600">
            Esta etapa deja listo el backend de lectura para categorias y productos
            usando Firestore. Auth, admin, carrito y pagos quedan para el siguiente corte.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <h2 className="text-lg font-semibold">Variables a completar</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li><code>NEXT_PUBLIC_FIREBASE_API_KEY</code></li>
              <li><code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code></li>
              <li><code>FIREBASE_CLIENT_EMAIL</code></li>
              <li><code>FIREBASE_PRIVATE_KEY</code></li>
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <h2 className="text-lg font-semibold">Rutas listas</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li><code>/api/categorias</code></li>
              <li><code>/api/categorias/con-productos</code></li>
              <li><code>/api/categorias/categoria/[nombre]</code></li>
              <li><code>/api/productos</code></li>
              <li><code>/api/productos/all</code></li>
              <li><code>/api/productos/search?search=</code></li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-7 text-sky-900">
          Nota: la busqueda de catalogo en esta etapa filtra en memoria para evitar
          indices complejos y reducir fallos mientras se estabiliza la migracion.
        </section>
      </div>
    </main>
  );
}
