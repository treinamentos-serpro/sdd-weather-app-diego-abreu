import type { City } from '../../types/weather';

interface ErrorStateProps {
  onRetry: () => void;
  operation?: 'search' | 'weather';
  city?: City;
  message?: string;
}

export default function ErrorState({ onRetry, operation, city, message }: ErrorStateProps) {
  const title =
    operation === 'search'
      ? 'Não foi possível buscar cidades.'
      : operation === 'weather'
        ? 'Não foi possível consultar o clima.'
        : 'Não foi possível concluir a solicitação.';

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center text-white backdrop-blur-md">
      <div role="alert" aria-atomic="true" className="space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {message && <p className="text-white/80">{message}</p>}
        {operation === 'weather' && city && (
          <p className="break-words text-white/80">
            {[city.name, city.admin1, city.country].filter(Boolean).join(', ')}
          </p>
        )}
        <p className="text-white/80">Tente novamente para atualizar os resultados.</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-night-900 transition hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        Tentar novamente
      </button>
    </div>
  );
}
