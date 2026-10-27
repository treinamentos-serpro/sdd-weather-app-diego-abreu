import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

function formatMetric(value: number | null, symbol: string, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return 'Indisponível';
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  })} ${symbol}`;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const temperature = formatTemperature(current.temperatureC, unit);
  const feelsLike = formatTemperature(current.feelsLikeC, unit);
  const temperatureUnit = unit === 'celsius' ? 'graus Celsius' : 'graus Fahrenheit';
  const metrics = [
    {
      label: 'Umidade',
      value: current.relativeHumidity,
      symbol: '%',
      unit: 'por cento',
      digits: 0,
    },
    {
      label: 'Vento',
      value: current.windSpeedKmh,
      symbol: 'km/h',
      unit: 'quilômetros por hora',
      digits: 0,
    },
    {
      label: 'Precipitação',
      value: current.precipitationMm,
      symbol: 'mm',
      unit: 'milímetros',
      digits: 1,
    },
    {
      label: 'Pressão',
      value: current.pressureHpa,
      symbol: 'hPa',
      unit: 'hectopascais',
      digits: 0,
    },
  ];

  return (
    <section
      aria-label="Clima atual"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-glass backdrop-blur-md md:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-bold md:text-3xl">{city.name}</h2>
          <p className="break-words text-white/80">
            {[city.admin1, city.country].filter(Boolean).join(', ')}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span aria-hidden="true" className="text-6xl">
              {getWeatherIcon(current.weatherCode)}
            </span>
            <p className="break-words text-5xl font-light sm:text-6xl md:text-7xl">
              <span className="sr-only">
                Temperatura: {temperature.replace(/°[CF]/, temperatureUnit)}
              </span>
              <span aria-hidden="true">{temperature}</span>
            </p>
          </div>
          <p className="mt-2 text-lg text-white/80">{getWeatherLabel(current.weatherCode)}</p>
          <p className="mt-2 text-white/80">
            <span className="sr-only">
              Sensação térmica: {feelsLike.replace(/°[CF]/, temperatureUnit)}
            </span>
            <span aria-hidden="true">Sensação térmica: {feelsLike}</span>
          </p>
        </div>
        <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          {metrics.map((metric) => {
            const value = formatMetric(metric.value, metric.symbol, metric.digits);
            return (
              <div
                key={metric.label}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <dt className="text-sm text-white/80">{metric.label}</dt>
                <dd className="font-semibold">
                  <span className="sr-only">{value.replace(metric.symbol, metric.unit)}</span>
                  <span aria-hidden="true">{value}</span>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
