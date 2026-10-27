import type { WeatherData } from '../types/weather';

export const mockWeatherData: WeatherData = {
  city: {
    id: 3448439,
    name: 'São Paulo',
    country: 'Brasil',
    admin1: 'São Paulo',
    latitude: -23.5475,
    longitude: -46.6361,
  },
  timezone: 'America/Sao_Paulo',
  current: {
    observedAt: '2026-10-27T18:00:00Z',
    temperatureC: 26.4,
    feelsLikeC: 27.8,
    weatherCode: 2,
    relativeHumidity: 65,
    windSpeedKmh: 12.6,
    precipitationMm: 0.4,
    pressureHpa: 1015.2,
  },
  forecast: [
    {
      date: '2026-10-27',
      weatherCode: 2,
      temperatureMinC: 18.2,
      temperatureMaxC: 28.5,
      precipitationProbability: 20,
    },
    {
      date: '2026-10-28',
      weatherCode: 0,
      temperatureMinC: 19.1,
      temperatureMaxC: 30.2,
      precipitationProbability: 0,
    },
    {
      date: '2026-10-29',
      weatherCode: 3,
      temperatureMinC: 20.3,
      temperatureMaxC: 27.6,
      precipitationProbability: 35,
    },
    {
      date: '2026-10-30',
      weatherCode: 61,
      temperatureMinC: 18.7,
      temperatureMaxC: 24.3,
      precipitationProbability: 80,
    },
    {
      date: '2026-10-31',
      weatherCode: 95,
      temperatureMinC: 17.5,
      temperatureMaxC: 25.8,
      precipitationProbability: 90,
    },
  ],
};
