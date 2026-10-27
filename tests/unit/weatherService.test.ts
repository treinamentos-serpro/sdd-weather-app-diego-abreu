import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';

const CITY = {
  id: 3448439,
  name: 'São Paulo',
  country: 'Brasil',
  admin1: 'São Paulo',
  latitude: -23.5475,
  longitude: -46.6361,
};

function mockResponse(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fetchWithTimeout nas consultas', () => {
  const operations = [
    { name: 'searchCities', run: () => searchCities('São Paulo') },
    { name: 'getWeather', run: () => getWeather(CITY) },
  ];

  it.each(operations)('aborta $name somente ao completar 10 segundos e limpa o timer', async ({
    run,
  }) => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: RequestInit) => {
        signal = options.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        });
      }),
    );

    const rejection = expect(run()).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'A requisição demorou demais.',
    });
    await vi.advanceTimersByTimeAsync(9_999);
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    expect(signal?.aborted).toBe(true);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    new DOMException('Aborted', 'AbortError'),
    Object.assign(new Error('Aborted'), { name: 'AbortError' }),
    new TypeError('Failed to fetch'),
  ])('converte $name em erro tipado e limpa o timer', async (cause) => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));

    await expect(searchCities('São Paulo')).rejects.toEqual(
      new WeatherServiceError(
        cause.name === 'AbortError' ? 'A requisição demorou demais.' : 'Falha de rede.',
        { cause, category: cause.name === 'AbortError' ? 'timeout' : 'network' },
      ),
    );
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  describe('fronteira HTTP completa', () => {
    it.each([
      [429, 'rate-limit', 'Limite de requisições atingido. Tente novamente mais tarde.'],
      [503, 'unavailable', 'Serviço indisponível. Tente novamente mais tarde.'],
      [400, 'http', 'Não foi possível buscar a cidade. Tente novamente.'],
    ])('classifica HTTP %s sem expor o corpo', async (status, category, message) => {
      mockResponse({ reason: 'detalhe interno' }, status);
      await expect(searchCities('São Paulo')).rejects.toMatchObject({ status, category, message });
    });

    it('classifica JSON inválido e falha de rede durante leitura do corpo', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{')));
      await expect(searchCities('São Paulo')).rejects.toMatchObject({
        category: 'invalid-response',
      });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.reject(new TypeError('Connection lost')),
        }),
      );
      await expect(searchCities('São Paulo')).rejects.toMatchObject({
        category: 'network',
        message: 'Falha de rede.',
      });
    });

    it.each([
      'timeout',
      'cancelled',
    ] as const)('mantém o prazo e cancelamento durante leitura do corpo: %s', async (category) => {
      vi.useFakeTimers();
      const external = new AbortController();
      const removeListener = vi.spyOn(external.signal, 'removeEventListener');
      let internalSignal: AbortSignal | undefined;
      vi.stubGlobal(
        'fetch',
        vi.fn(async (_url: string, options: RequestInit) => {
          internalSignal = options.signal ?? undefined;
          await new Promise((resolve) => setTimeout(resolve, 4_000));
          return {
            ok: true,
            json: () =>
              new Promise((_resolve, reject) => {
                internalSignal?.addEventListener('abort', () =>
                  reject(new DOMException('Aborted', 'AbortError')),
                );
              }),
          };
        }),
      );
      const rejection = expect(searchCities('São Paulo', external.signal)).rejects.toMatchObject({
        category,
        message: category === 'timeout' ? 'A requisição demorou demais.' : 'Requisição cancelada.',
      });
      await vi.advanceTimersByTimeAsync(9_999);
      expect(internalSignal?.aborted).toBe(false);
      if (category === 'cancelled') external.abort();
      else await vi.advanceTimersByTimeAsync(1);
      await rejection;
      expect(internalSignal?.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
      expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    });

    it('não chama a rede com sinal previamente cancelado', async () => {
      const external = new AbortController();
      external.abort();
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      await expect(searchCities('São Paulo', external.signal)).rejects.toMatchObject({
        category: 'cancelled',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('remove o listener externo ao concluir com sucesso', async () => {
      const external = new AbortController();
      const removeListener = vi.spyOn(external.signal, 'removeEventListener');
      const fetchMock = mockResponse({});
      await searchCities('São Paulo', external.signal);
      expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
      external.abort();
      expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
    });
  });

  it.each([200, 500])('limpa o timer após resposta HTTP %s', async (status) => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const fetchMock = mockResponse({}, status);

    if (status === 200) {
      expect(await searchCities('São Paulo')).toEqual([]);
    } else {
      await expect(searchCities('São Paulo')).rejects.toBeInstanceOf(WeatherServiceError);
    }
    const signal: AbortSignal = fetchMock.mock.calls[0][1].signal;
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(signal.aborted).toBe(false);
  });
});

function forecastResponse() {
  return {
    timezone: 'Europe/Berlin',
    current_units: {
      time: 'unixtime',
      temperature_2m: '°C',
      apparent_temperature: '°C',
      weather_code: 'wmo code',
      relative_humidity_2m: '%',
      wind_speed_10m: 'km/h',
      precipitation: 'mm',
      pressure_msl: 'hPa',
    },
    daily_units: {
      time: 'unixtime',
      weather_code: 'wmo code',
      temperature_2m_min: '°C',
      temperature_2m_max: '°C',
      precipitation_probability_max: '%',
    },
    current: {
      time: Date.parse('2026-10-24T12:00:00Z') / 1000,
      temperature_2m: 18.4,
      apparent_temperature: 16.2,
      weather_code: 3,
      relative_humidity_2m: 80,
      wind_speed_10m: 10,
      precipitation: 0,
      pressure_msl: 1015.2,
    },
    daily: {
      time: [
        '2026-10-23T22:00:00Z',
        '2026-10-24T22:00:00Z',
        '2026-10-25T23:00:00Z',
        '2026-10-26T23:00:00Z',
        '2026-10-27T23:00:00Z',
      ].map((date) => Date.parse(date) / 1000),
      weather_code: [3, 61, 80, 1, 0],
      temperature_2m_min: [12, 11, 13, 14, 15],
      temperature_2m_max: [20, 19, 22, 24, 25],
      precipitation_probability_max: [20, 90, 70, 10, 0],
    },
  };
}

describe('getWeather', () => {
  function freezeTime() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-24T12:00:00Z'));
  }

  it('consulta current/daily em uma chamada com coordenadas e unidades explícitas', async () => {
    freezeTime();
    const fetchMock = mockResponse(forecastResponse());

    await getWeather(CITY);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(`${url.origin}${url.pathname}`).toBe('https://api.open-meteo.com/v1/forecast');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      latitude: String(CITY.latitude),
      longitude: String(CITY.longitude),
      current:
        'temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,pressure_msl',
      daily: 'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '5',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
      timeformat: 'unixtime',
    });
  });

  it('mapeia current e cinco dias por índice, respeitando o fuso e a mudança de horário', async () => {
    freezeTime();
    mockResponse(forecastResponse());

    const data = await getWeather(CITY);

    expect(data.city).toBe(CITY);
    expect(data.timezone).toBe('Europe/Berlin');
    expect(data.current).toEqual({
      observedAt: '2026-10-24T12:00:00.000Z',
      temperatureC: 18.4,
      feelsLikeC: 16.2,
      weatherCode: 3,
      relativeHumidity: 80,
      windSpeedKmh: 10,
      precipitationMm: 0,
      pressureHpa: 1015.2,
    });
    expect(data.forecast).toEqual(
      [24, 25, 26, 27, 28].map((day, index) => ({
        date: `2026-10-${day}`,
        weatherCode: [3, 61, 80, 1, 0][index],
        temperatureMinC: [12, 11, 13, 14, 15][index],
        temperatureMaxC: [20, 19, 22, 24, 25][index],
        precipitationProbability: [20, 90, 70, 10, 0][index],
      })),
    );
  });

  it('normaliza precipitação atual null para zero', async () => {
    freezeTime();
    const body = forecastResponse();
    mockResponse({
      ...body,
      current: { ...body.current, precipitation: null },
    });

    const data = await getWeather(CITY);

    expect(data.current.precipitationMm).toBe(0);
  });

  it.each([
    {},
    { current: {} },
    { daily: {} },
    { current: null, daily: {} },
    { current: {}, daily: null },
    { current: [], daily: {} },
  ])('rejeita resposta incompleta: %j', async (body) => {
    mockResponse(body);
    await expect(getWeather(CITY)).rejects.toThrow('Resposta de clima incompleta');
    await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('mantém campos ausentes, inválidos ou com unidade incompatível como null no mesmo índice', async () => {
    freezeTime();
    const body = forecastResponse();
    body.current.temperature_2m = Number.NaN;
    body.current.relative_humidity_2m = 101;
    body.current.wind_speed_10m = -1;
    body.current.pressure_msl = 0;
    body.current_units.apparent_temperature = '°F';
    body.daily.temperature_2m_min = [12];
    body.daily.precipitation_probability_max = [0, -1, 101];
    mockResponse(body);

    const data = await getWeather(CITY);

    expect(data.current).toMatchObject({
      temperatureC: null,
      feelsLikeC: null,
      relativeHumidity: null,
      windSpeedKmh: null,
      pressureHpa: null,
    });
    expect(data.forecast.map((day) => day.temperatureMinC)).toEqual([12, null, null, null, null]);
    expect(data.forecast.map((day) => day.precipitationProbability)).toEqual([
      0,
      null,
      null,
      null,
      null,
    ]);
    expect(data.forecast[4].temperatureMaxC).toBe(25);
  });

  it('mantém como null medidas cujas propriedades foram omitidas pela API', async () => {
    freezeTime();
    const body = forecastResponse();
    mockResponse({
      ...body,
      current: Object.fromEntries(
        Object.entries(body.current).filter(([key]) => key !== 'apparent_temperature'),
      ),
      daily: Object.fromEntries(
        Object.entries(body.daily).filter(
          ([key]) => !['temperature_2m_min', 'precipitation_probability_max'].includes(key),
        ),
      ),
    });

    const data = await getWeather(CITY);

    expect(data.current.feelsLikeC).toBeNull();
    expect(data.current.temperatureC).toBe(18.4);
    expect(data.forecast.map((day) => day.temperatureMinC)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(data.forecast.map((day) => day.temperatureMaxC)).toEqual([20, 19, 22, 24, 25]);
    expect(data.forecast.map((day) => day.precipitationProbability)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it.each(['', 'invalid/timezone'])('rejeita fuso inválido: %j', async (timezone) => {
    mockResponse({ ...forecastResponse(), timezone });
    await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it.each([
    'short',
    'long',
    'duplicate',
    'gap',
    'invalid',
    'yesterday',
  ])('rejeita sequência de datas %s sem fabricar dias', async (scenario) => {
    freezeTime();
    const body = forecastResponse();
    if (scenario === 'short') body.daily.time.pop();
    if (scenario === 'long') body.daily.time.push(body.daily.time[4] + 86400);
    if (scenario === 'duplicate') body.daily.time[1] = body.daily.time[0];
    if (scenario === 'gap') body.daily.time[1] = body.daily.time[2] + 86400;
    if (scenario === 'invalid') body.daily.time[1] = Number.NaN;
    if (scenario === 'yesterday') body.daily.time[0] -= 86400;
    mockResponse(body);
    await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it.each([
    [400, 'http', 'Não foi possível carregar o clima. Tente novamente.'],
    [429, 'rate-limit', 'Limite de requisições atingido. Tente novamente mais tarde.'],
    [503, 'unavailable', 'Serviço indisponível. Tente novamente mais tarde.'],
  ] as const)(
    'classifica HTTP %s sem expor o corpo de erro',
    async (status, category, message) => {
      mockResponse({ reason: 'detalhe interno da API' }, status);
      await expect(getWeather(CITY)).rejects.toMatchObject({
        status,
        category,
        message,
      });
    },
  );

  it('rejeita falhas de rede e JSON inválido com erro tipado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{')));
    await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
  });
});

describe('searchCities', () => {
  it.each(['', '   ', '\t\n'])('retorna vazio sem rede para %j', async (name) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await searchCities(name)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('apara e codifica o nome sem permitir parâmetros adicionais', async () => {
    const fetchMock = mockResponse({ results: [] });
    const name = 'São Paulo &name=Berlin';

    await searchCities(`  ${name}  `);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=pt&format=json`,
      { signal: expect.any(AbortSignal) },
    );
  });

  it('mapeia todos os campos e resultados, ignorando campos extras', async () => {
    const { admin1: _admin1, ...withoutRegion } = CITY;
    mockResponse({
      results: [
        { ...CITY, population: 100 },
        { ...withoutRegion, id: 2 },
      ],
    });

    expect(await searchCities('São Paulo')).toEqual([
      CITY,
      { ...withoutRegion, id: 2, admin1: null },
    ]);
  });

  it.each([{}, { results: [] }])('retorna vazio sem resultados: %j', async (body) => {
    mockResponse(body);
    expect(await searchCities('xyz')).toEqual([]);
  });

  it.each([400, 429, 500])('lança erro tipado para HTTP %s sem ler JSON', async (status) => {
    const response = new Response('não é JSON', { status });
    const jsonSpy = vi.spyOn(response, 'json');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    await expect(searchCities('São Paulo')).rejects.toBeInstanceOf(WeatherServiceError);
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it.each([
    null,
    [],
    { results: null },
    { results: {} },
    { results: [{ ...CITY, id: 1.5 }] },
    { results: [{ ...CITY, name: '' }] },
    { results: [{ ...CITY, country: undefined }] },
    { results: [{ ...CITY, latitude: 91 }] },
    { results: [{ ...CITY, longitude: -181 }] },
    { results: [{ ...CITY, admin1: 1 }] },
  ])('rejeita resposta inválida: %j', async (body) => {
    mockResponse(body);
    await expect(searchCities('São Paulo')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('propaga falha de rede como erro tipado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(searchCities('São Paulo')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('rejeita JSON inválido como erro tipado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{')));
    await expect(searchCities('São Paulo')).rejects.toBeInstanceOf(WeatherServiceError);
  });
});
