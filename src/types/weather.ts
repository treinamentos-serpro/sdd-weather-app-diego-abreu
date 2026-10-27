export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
}

/** Medidas ausentes ou inválidas são null; temperaturas permanecem em Celsius. */
export interface CurrentWeather {
  /** Instante ISO 8601 UTC, com sufixo Z. */
  observedAt: string | null;
  temperatureC: number | null;
  feelsLikeC: number | null;
  /** Código da condição na tabela WMO. */
  weatherCode: number | null;
  /** Percentual entre 0 e 100. */
  relativeHumidity: number | null;
  windSpeedKmh: number | null;
  /** Precipitação no intervalo atual, em mm. */
  precipitationMm: number | null;
  /** Pressão ao nível do mar, em hPa. */
  pressureHpa: number | null;
}

export interface ForecastDay {
  /** Data YYYY-MM-DD no fuso da cidade. */
  date: string;
  weatherCode: number | null;
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
  /** Percentual máximo diário entre 0 e 100. */
  precipitationProbability: number | null;
}

export interface WeatherData {
  city: City;
  /** Fuso IANA, como America/Sao_Paulo. */
  timezone: string;
  current: CurrentWeather;
  /** Hoje e os quatro dias seguintes; sequência validada pelo serviço. */
  forecast: ForecastDay[];
}
