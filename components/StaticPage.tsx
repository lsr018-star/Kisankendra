export default function StaticPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="card mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-leaf-900">{title}</h1>
      <p className="mt-1 rounded bg-cream px-3 py-2 text-xs text-neutral-600">
        Template content — to be reviewed and finalised with qualified legal counsel before real transactions
        are enabled.
      </p>
      <div className="prose-sm mt-4 space-y-4 text-neutral-800 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-leaf-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </article>
  );
}
