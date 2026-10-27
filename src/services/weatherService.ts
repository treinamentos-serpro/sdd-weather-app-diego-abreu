import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

export type WeatherServiceErrorCategory =
  | 'timeout'
  | 'cancelled'
  | 'network'
  | 'rate-limit'
  | 'unavailable'
  | 'http'
  | 'invalid-response';

interface WeatherServiceErrorOptions extends ErrorOptions {
  category?: WeatherServiceErrorCategory;
  status?: number;
}

export class WeatherServiceError extends Error {
  readonly category: WeatherServiceErrorCategory;
  readonly status?: number;

  constructor(message: string, options?: WeatherServiceErrorOptions) {
    super(message, options);
    this.name = 'WeatherServiceError';
    this.category = options?.category ?? 'invalid-response';
    this.status = options?.status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapCity(value: unknown): City {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    !Number.isInteger(value.id) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    typeof value.country !== 'string' ||
    !value.country.trim() ||
    typeof value.latitude !== 'number' ||
    !Number.isFinite(value.latitude) ||
    Math.abs(value.latitude) > 90 ||
    typeof value.longitude !== 'number' ||
    !Number.isFinite(value.longitude) ||
    Math.abs(value.longitude) > 180 ||
    (value.admin1 != null && typeof value.admin1 !== 'string')
  ) {
    throw new WeatherServiceError('Resposta de busca inválida. Tente novamente.');
  }

  return {
    id: value.id,
    name: value.name,
    country: value.country,
    admin1: value.admin1 ?? null,
    latitude: value.latitude,
    longitude: value.longitude,
  };
}

async function fetchWithTimeout(
  url: string,
  errorMessage: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    controller.signal.throwIfAborted();
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const category =
        response.status === 429 ? 'rate-limit' : response.status >= 500 ? 'unavailable' : 'http';
      const message =
        category === 'rate-limit'
          ? 'Limite de requisições atingido. Tente novamente mais tarde.'
          : category === 'unavailable'
            ? 'Serviço indisponível. Tente novamente mais tarde.'
            : errorMessage;
      throw new WeatherServiceError(message, { category, status: response.status });
    }
    return await response.json();
  } catch (cause) {
    if (controller.signal.aborted || (isRecord(cause) && cause.name === 'AbortError')) {
      const cancelled = signal?.aborted;
      throw new WeatherServiceError(
        cancelled ? 'Requisição cancelada.' : 'A requisição demorou demais.',
        { cause, category: cancelled ? 'cancelled' : 'timeout' },
      );
    }
    if (cause instanceof WeatherServiceError) throw cause;
    if (isRecord(cause) && cause.name === 'SyntaxError') {
      throw new WeatherServiceError('Resposta inválida. Tente novamente.', { cause });
    }
    throw new WeatherServiceError('Falha de rede.', { cause, category: 'network' });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export async function searchCities(name: string, signal?: AbortSignal): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`;
  const data = await fetchWithTimeout(
    url,
    'Não foi possível buscar a cidade. Tente novamente.',
    signal,
  );

  if (!isRecord(data) || ('results' in data && !Array.isArray(data.results))) {
    throw new WeatherServiceError('Resposta de busca inválida. Tente novamente.');
  }

  return Array.isArray(data.results) ? data.results.map(mapCity) : [];
}

function unixDate(value: unknown): Date | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const date = new Date(value * 1000);
  return Number.isFinite(date.getTime()) ? date : null;
}

function measurement(
  value: unknown,
  unit: unknown,
  expectedUnit: string,
  min = -Infinity,
  max = Infinity,
): number | null {
  return unit === expectedUnit &&
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
    ? value
    : null;
}

function weatherCode(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

function localDate(date: Date, formatter: Intl.DateTimeFormat): string {
  const parts = formatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export async function getWeather(city: City, signal?: AbortSignal): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
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
  const data = await fetchWithTimeout(
    `${FORECAST_URL}?${params}`,
    'Não foi possível carregar o clima. Tente novamente.',
    signal,
  );
  if (!isRecord(data) || !isRecord(data.current) || !isRecord(data.daily)) {
    throw new WeatherServiceError('Resposta de clima incompleta. Tente novamente.');
  }
  if (typeof data.timezone !== 'string' || !data.timezone.trim()) {
    throw new WeatherServiceError('Fuso horário inválido. Tente novamente.');
  }

  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: data.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (cause) {
    throw new WeatherServiceError('Fuso horário inválido. Tente novamente.', { cause });
  }

  const currentUnits = isRecord(data.current_units) ? data.current_units : {};
  const dailyUnits = isRecord(data.daily_units) ? data.daily_units : {};
  const raw = data.current;
  const observedAt = currentUnits.time === 'unixtime' ? unixDate(raw.time) : null;
  const current: CurrentWeather = {
    observedAt: observedAt?.toISOString() ?? null,
    temperatureC: measurement(raw.temperature_2m, currentUnits.temperature_2m, '°C'),
    feelsLikeC: measurement(raw.apparent_temperature, currentUnits.apparent_temperature, '°C'),
    weatherCode: currentUnits.weather_code === 'wmo code' ? weatherCode(raw.weather_code) : null,
    relativeHumidity: measurement(
      raw.relative_humidity_2m,
      currentUnits.relative_humidity_2m,
      '%',
      0,
      100,
    ),
    windSpeedKmh: measurement(raw.wind_speed_10m, currentUnits.wind_speed_10m, 'km/h', 0),
    precipitationMm:
      raw.precipitation === null && currentUnits.precipitation === 'mm'
        ? 0
        : measurement(raw.precipitation, currentUnits.precipitation, 'mm', 0),
    pressureHpa:
      typeof raw.pressure_msl === 'number' && raw.pressure_msl > 0
        ? measurement(raw.pressure_msl, currentUnits.pressure_msl, 'hPa')
        : null,
  };

  const daily = data.daily;
  if (!Array.isArray(daily.time) || daily.time.length !== 5 || dailyUnits.time !== 'unixtime') {
    throw new WeatherServiceError('Previsão de cinco dias incompleta. Tente novamente.');
  }
  const today = localDate(new Date(), formatter);
  const calendarDay = new Date(`${today}T00:00:00Z`);
  const forecast: ForecastDay[] = daily.time.map((timestamp: unknown, index: number) => {
    const instant = unixDate(timestamp);
    const date = instant ? localDate(instant, formatter) : null;
    if (date !== calendarDay.toISOString().slice(0, 10)) {
      throw new WeatherServiceError('Previsão de cinco dias inválida. Tente novamente.');
    }
    calendarDay.setUTCDate(calendarDay.getUTCDate() + 1);
    const value = (key: string): unknown =>
      Array.isArray(daily[key]) ? daily[key][index] : undefined;
    return {
      date,
      weatherCode:
        dailyUnits.weather_code === 'wmo code' ? weatherCode(value('weather_code')) : null,
      temperatureMinC: measurement(
        value('temperature_2m_min'),
        dailyUnits.temperature_2m_min,
        '°C',
      ),
      temperatureMaxC: measurement(
        value('temperature_2m_max'),
        dailyUnits.temperature_2m_max,
        '°C',
      ),
      precipitationProbability: measurement(
        value('precipitation_probability_max'),
        dailyUnits.precipitation_probability_max,
        '%',
        0,
        100,
      ),
    };
  });

  return { city, timezone: data.timezone, current, forecast };
}
