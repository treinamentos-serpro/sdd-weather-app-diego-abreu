import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
  operation: 'search' | 'weather' | null;
  selectedCity: City | null;
}

interface UseWeatherResult extends WeatherState {
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

type Operation = { type: 'search'; query: string } | { type: 'weather'; city: City };

export function useWeather(): UseWeatherResult {
  const [state, setState] = useState<WeatherState>({
    status: 'idle',
    data: null,
    cities: [],
    error: null,
    query: '',
    operation: null,
    selectedCity: null,
  });
  const operationId = useRef(0);
  const lastOperation = useRef<Operation | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      operationId.current += 1;
      controllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(async (operation: Operation): Promise<void> => {
    const id = ++operationId.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    lastOperation.current = operation;
    setState((previous) => ({
      ...previous,
      status: 'loading',
      data: null,
      error: null,
      operation: operation.type,
      selectedCity: operation.type === 'weather' ? operation.city : null,
      ...(operation.type === 'search' ? { query: operation.query, cities: [] } : {}),
    }));

    try {
      let city: City;
      if (operation.type === 'search') {
        const cities = await searchCities(operation.query, controller.signal);
        if (id !== operationId.current) return;
        if (cities.length === 0) {
          setState((previous) => ({ ...previous, status: 'empty', cities: [] }));
          return;
        }
        city = cities[0];
        setState((previous) => ({
          ...previous,
          cities,
          operation: 'weather',
          selectedCity: cities[0],
        }));
        lastOperation.current = { type: 'weather', city };
      } else {
        city = operation.city;
      }

      const data = await getWeather(city, controller.signal);
      if (id !== operationId.current) return;
      setState((previous) => ({ ...previous, status: 'success', data }));
    } catch (error) {
      if (id !== operationId.current) return;
      setState((previous) => ({
        ...previous,
        status: 'error',
        error:
          error instanceof WeatherServiceError
            ? error.message
            : 'Algo deu errado. Tente novamente.',
      }));
    } finally {
      if (id === operationId.current) controllerRef.current = null;
    }
  }, []);

  const search = useCallback(
    async (name: string): Promise<void> => {
      const query = name.trim();
      if (!query) return;
      await execute({ type: 'search', query });
    },
    [execute],
  );

  const selectCity = useCallback(
    async (city: City): Promise<void> => {
      await execute({ type: 'weather', city });
    },
    [execute],
  );

  const retry = useCallback(async (): Promise<void> => {
    if (lastOperation.current) await execute(lastOperation.current);
  }, [execute]);

  return { ...state, search, selectCity, retry };
}
