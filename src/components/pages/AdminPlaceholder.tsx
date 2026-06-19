type AdminPlaceholderProps = {
  title: string;
  description?: string;
};

export function AdminPlaceholder({
  title,
  description = "This section is coming soon.",
}: AdminPlaceholderProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
      <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}
