import { useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, operation, selectedCity, error, search, retry } = useWeather();
  const mainRef = useRef<HTMLElement>(null);

  return (
    <div className="flex min-h-screen flex-col text-white">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-night-900 p-3 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:outline focus:outline-2 focus:outline-accent-400"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-white/10 bg-night-900/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden="true" className="shrink-0 text-3xl text-sun">
              ☀️
            </span>
            <h1 className="text-2xl font-bold">WeatherView</h1>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-4 sm:flex-row sm:items-end lg:justify-end">
            <SearchBar onSearch={search} disabled={status === 'loading'} />
            <div className="shrink-0">
              <UnitToggle unit={unit} onChange={setUnit} />
            </div>
          </div>
        </div>
      </header>

      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
      >
        {status === 'idle' && (
          <EmptyState
            title="Busque uma cidade para começar"
            hint="Digite o nome de uma cidade para consultar o clima e a previsão."
          />
        )}
        {status === 'loading' && <LoadingState operation={operation ?? undefined} />}
        {status === 'empty' && <EmptyState />}
        {status === 'error' && (
          <ErrorState
            operation={operation ?? undefined}
            city={selectedCity ?? undefined}
            message={error ?? undefined}
            onRetry={() => {
              void retry();
              mainRef.current?.focus();
            }}
          />
        )}
        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {status === 'success' && data
            ? `Exibindo o clima de ${data.city.name} e a previsão de 5 dias.`
            : ''}
        </p>
        {status === 'success' && data && (
          <>
            <CurrentWeather city={data.city} current={data.current} unit={unit} />
            <ForecastList forecast={data.forecast} unit={unit} />
          </>
        )}
      </main>

      <footer className="border-t border-white/10 px-4 py-6 text-center text-sm text-white/80">
        Dados meteorológicos fornecidos pela{' '}
        <a
          href="https://open-meteo.com/"
          className="rounded text-accent-300 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
        >
          Open-Meteo
        </a>
        .
      </footer>
    </div>
  );
}
