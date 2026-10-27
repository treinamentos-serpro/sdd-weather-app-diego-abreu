import { type FormEvent, useId, useRef, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    const city = value.trim();
    if (!city || Array.from(city).length > 100) {
      setError(!city ? 'Digite o nome de uma cidade.' : 'Use no máximo 100 caracteres.');
      inputRef.current?.focus();
      return;
    }

    setError(null);
    onSearch(city);
  }

  return (
    <form
      role="search"
      aria-label="Busca de cidades"
      onSubmit={handleSubmit}
      className="w-full min-w-0 max-w-md space-y-2"
    >
      <label htmlFor={inputId} className="block text-sm font-medium text-white">
        Buscar cidade
      </label>
      <div className="flex flex-col gap-2 rounded-xl border border-white/50 bg-white/5 p-3 backdrop-blur-md focus-within:border-accent-400 sm:flex-row">
        <input
          ref={inputRef}
          id={inputId}
          name="city"
          type="search"
          value={value}
          disabled={disabled}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder="Ex.: São Paulo"
          autoComplete="off"
          className="min-h-11 min-w-0 flex-1 rounded-lg bg-transparent px-2 py-2 text-white placeholder:text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="min-h-11 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-night-900 transition hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-white">
          {error}
        </p>
      )}
    </form>
  );
}
