import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...original, searchCities: vi.fn(), getWeather: vi.fn() };
});

const city = mockWeatherData.city;
const otherCity: City = { ...city, id: 2, name: 'Lisboa' };
const otherWeather: WeatherData = { ...mockWeatherData, city: otherCity };
const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  searchMock.mockReset().mockResolvedValue([city, otherCity]);
  weatherMock.mockReset().mockResolvedValue(mockWeatherData);
});

afterEach(cleanup);

describe('useWeather', () => {
  it.each([
    'search',
    'weather',
  ] as const)('aborta a etapa %s substituída sem publicar erro e preserva o retry vigente', async (operation) => {
    const { result } = renderHook(() => useWeather());
    let oldSignal: AbortSignal | undefined;
    const cancelled = (_value: string | City, signal?: AbortSignal): Promise<never> =>
      new Promise((_resolve, reject) => {
        oldSignal = signal;
        signal?.addEventListener('abort', () =>
          reject(new WeatherServiceError('Requisição cancelada.', { category: 'cancelled' })),
        );
      });
    if (operation === 'search') searchMock.mockImplementationOnce(cancelled);
    else weatherMock.mockImplementationOnce(cancelled);
    let pending!: Promise<void>;
    act(() => {
      pending =
        operation === 'search' ? result.current.search('Antiga') : result.current.selectCity(city);
    });
    expect(oldSignal?.aborted).toBe(false);
    await act(async () => {
      await result.current.selectCity(otherCity);
      await pending;
    });
    expect(oldSignal?.aborted).toBe(true);
    expect(result.current).toMatchObject({
      status: 'success',
      error: null,
      operation: 'weather',
      selectedCity: otherCity,
    });
    await act(async () => {
      await result.current.retry();
    });
    expect(weatherMock).toHaveBeenLastCalledWith(otherCity, expect.any(AbortSignal));
  });

  it.each(['search', 'weather'] as const)('aborta %s ao desmontar', async (operation) => {
    let signal: AbortSignal | undefined;
    const pendingRequest = (_value: string | City, receivedSignal?: AbortSignal): Promise<never> =>
      new Promise((_resolve, reject) => {
        signal = receivedSignal;
        signal?.addEventListener('abort', () =>
          reject(new WeatherServiceError('Requisição cancelada.', { category: 'cancelled' })),
        );
      });
    if (operation === 'search') searchMock.mockImplementationOnce(pendingRequest);
    else weatherMock.mockImplementationOnce(pendingRequest);
    const { result, unmount } = renderHook(() => useWeather());
    let pending!: Promise<void>;
    act(() => {
      pending =
        operation === 'search'
          ? result.current.search('São Paulo')
          : result.current.selectCity(city);
    });
    unmount();
    await pending;
    expect(signal?.aborted).toBe(true);
  });

  it('preserva operação e cidade explícitas em erro mesmo sem resultados de busca', async () => {
    weatherMock.mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.selectCity(otherCity);
    });
    expect(result.current).toMatchObject({
      status: 'error',
      operation: 'weather',
      selectedCity: otherCity,
      cities: [],
    });
    searchMock.mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    await act(async () => {
      await result.current.search('Nova busca');
    });
    expect(result.current).toMatchObject({
      status: 'error',
      operation: 'search',
      selectedCity: null,
      cities: [],
    });
  });

  it('inicia idle e ignora busca vazia e retry sem operação', async () => {
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.search('  ');
      await result.current.retry();
    });
    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      error: null,
      query: '',
    });
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('expõe loading na busca e no clima, depois sucesso com a primeira cidade', async () => {
    const cities = deferred<City[]>();
    const weather = deferred<WeatherData>();
    searchMock.mockReturnValue(cities.promise);
    weatherMock.mockReturnValue(weather.promise);
    const { result } = renderHook(() => useWeather());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.search('  São Paulo  ');
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.query).toBe('São Paulo');
    expect(searchMock).toHaveBeenCalledExactlyOnceWith('São Paulo', expect.any(AbortSignal));
    await act(async () => {
      cities.resolve([city, otherCity]);
    });
    expect(result.current.cities).toEqual([city, otherCity]);
    expect(result.current.status).toBe('loading');
    expect(weatherMock).toHaveBeenCalledExactlyOnceWith(city, expect.any(AbortSignal));
    expect(result.current.operation).toBe('weather');
    expect(result.current.selectedCity).toBe(city);
    await act(async () => {
      weather.resolve(mockWeatherData);
      await pending;
    });
    expect(result.current).toMatchObject({ status: 'success', data: mockWeatherData, error: null });
  });

  it('sem cidades retorna empty e não consulta previsão', async () => {
    searchMock.mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.search('xyz');
    });
    expect(result.current).toMatchObject({ status: 'empty', cities: [], data: null });
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('seleciona outra cidade, remove dados anteriores e preserva as opções', async () => {
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.search('São Paulo');
    });
    const weather = deferred<WeatherData>();
    weatherMock.mockReturnValue(weather.promise);
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.selectCity(otherCity);
    });
    expect(result.current).toMatchObject({
      status: 'loading',
      data: null,
      cities: [city, otherCity],
      operation: 'weather',
      selectedCity: otherCity,
    });
    await act(async () => {
      weather.resolve(otherWeather);
      await pending;
    });
    expect(weatherMock).toHaveBeenLastCalledWith(otherCity, expect.any(AbortSignal));
    expect(result.current.data).toBe(otherWeather);
  });

  it('retry de erro na busca usa o último termo, não a cidade de uma busca anterior', async () => {
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.search('São Paulo');
    });
    searchMock.mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    await act(async () => {
      await result.current.search('Lisboa');
    });
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Falha de rede.',
      query: 'Lisboa',
      data: null,
      cities: [],
    });
    await act(async () => {
      await result.current.retry();
    });
    expect(searchMock).toHaveBeenCalledTimes(3);
    expect(searchMock).toHaveBeenLastCalledWith('Lisboa', expect.any(AbortSignal));
    expect(result.current).toMatchObject({ status: 'success', error: null });
  });

  it('retry de erro no clima repete apenas a previsão da primeira cidade', async () => {
    weatherMock.mockRejectedValueOnce(new WeatherServiceError('A requisição demorou demais.'));
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.search('São Paulo');
    });
    expect(result.current.error).toBe('A requisição demorou demais.');
    await act(async () => {
      await result.current.retry();
    });
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(weatherMock).toHaveBeenCalledTimes(2);
    expect(weatherMock).toHaveBeenLastCalledWith(city, expect.any(AbortSignal));
    expect(result.current.status).toBe('success');
  });

  it('retry repete seleção explícita e comunica erros inesperados', async () => {
    weatherMock.mockRejectedValueOnce(new Error('unexpected'));
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.selectCity(otherCity);
    });
    expect(result.current.error).toBe('Algo deu errado. Tente novamente.');
    await act(async () => {
      await result.current.retry();
    });
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).toHaveBeenCalledTimes(2);
    expect(weatherMock).toHaveBeenLastCalledWith(otherCity, expect.any(AbortSignal));
  });

  it.each([
    'resolve',
    'reject',
  ] as const)('ignora busca obsoleta que termina com %s', async (finish) => {
    const oldSearch = deferred<City[]>();
    searchMock.mockReturnValueOnce(oldSearch.promise);
    const { result } = renderHook(() => useWeather());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.search('Antiga');
    });
    await act(async () => {
      await result.current.selectCity(otherCity);
    });
    await act(async () => {
      if (finish === 'resolve') oldSearch.resolve([city]);
      else oldSearch.reject(new WeatherServiceError('Falha de rede.'));
      await pending;
    });
    expect(result.current.status).toBe('success');
    expect(weatherMock).toHaveBeenCalledExactlyOnceWith(otherCity, expect.any(AbortSignal));
    await act(async () => {
      await result.current.retry();
    });
    expect(weatherMock).toHaveBeenLastCalledWith(otherCity, expect.any(AbortSignal));
  });

  it.each([
    'resolve',
    'reject',
  ] as const)('ignora previsão obsoleta que termina com %s', async (finish) => {
    const oldWeather = deferred<WeatherData>();
    weatherMock.mockReturnValueOnce(oldWeather.promise);
    const { result } = renderHook(() => useWeather());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.selectCity(city);
    });
    searchMock.mockResolvedValueOnce([]);
    await act(async () => {
      await result.current.search('xyz');
    });
    await act(async () => {
      if (finish === 'resolve') oldWeather.resolve(mockWeatherData);
      else oldWeather.reject(new WeatherServiceError('Falha de rede.'));
      await pending;
    });
    expect(result.current).toMatchObject({
      status: 'empty',
      data: null,
      error: null,
      query: 'xyz',
    });
  });

  it('não inicia previsão quando a busca termina após desmontagem', async () => {
    const cities = deferred<City[]>();
    searchMock.mockReturnValue(cities.promise);
    const { result, unmount } = renderHook(() => useWeather());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.search('São Paulo');
    });
    unmount();
    await act(async () => {
      cities.resolve([city]);
      await pending;
    });
    expect(weatherMock).not.toHaveBeenCalled();
  });
});
