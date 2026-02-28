interface EmptyCatalogStateProps {
  title: string;
  description: string;
}

export function EmptyCatalogState({ title, description }: EmptyCatalogStateProps) {
  return (
    <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-center">
      <h2 className="text-xl font-semibold text-black">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
        {description}
      </p>
    </section>
  );
}
