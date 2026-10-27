interface EmptyStateProps {
  title?: string;
  hint?: string;
}

export default function EmptyState({
  title = 'Nenhuma cidade encontrada',
  hint = 'Confira o nome da cidade ou tente uma busca mais específica.',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center text-white backdrop-blur-md"
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-white/80">{hint}</p>
    </div>
  );
}
