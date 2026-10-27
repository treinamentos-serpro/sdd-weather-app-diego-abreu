interface LoadingStateProps {
  operation?: 'search' | 'weather';
}

export default function LoadingState({ operation = 'weather' }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center text-white backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="h-10 w-10 rounded-full border-4 border-white/20 border-t-accent-400 motion-safe:animate-spin"
      />
      <p>{operation === 'search' ? 'Buscando cidades…' : 'Consultando o clima…'}</p>
    </div>
  );
}
