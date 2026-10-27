import { getDayLabel, getShortDate } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  index: number;
  unit: Unit;
}

export default function ForecastCard({ day, index, unit }: ForecastCardProps) {
  const label = getDayLabel(day.date, index);
  const date = getShortDate(day.date);
  const minimum = formatTemperature(day.temperatureMinC, unit);
  const maximum = formatTemperature(day.temperatureMaxC, unit);
  const temperatureUnit = unit === 'celsius' ? 'graus Celsius' : 'graus Fahrenheit';
  const probability = day.precipitationProbability;
  const precipitation =
    probability === null || !Number.isFinite(probability) || probability < 0 || probability > 100
      ? 'Indisponível'
      : `${Math.round(probability)} %`;

  return (
    <li
      aria-label={`${label}, ${date}`}
      className="flex min-w-0 flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white backdrop-blur-md"
    >
      <h3 className="font-semibold">{label}</h3>
      <time dateTime={day.date} className="text-sm text-white/80">
        {date}
      </time>
      <span aria-hidden="true" className="text-4xl">
        {getWeatherIcon(day.weatherCode)}
      </span>
      <p className="text-sm text-white/80">{getWeatherLabel(day.weatherCode)}</p>
      <dl className="w-full space-y-2 text-sm">
        <div>
          <dt className="text-white/80">Máxima</dt>
          <dd className="font-semibold">
            <span className="sr-only">{maximum.replace(/°[CF]/, temperatureUnit)}</span>
            <span aria-hidden="true">{maximum}</span>
          </dd>
        </div>
        <div>
          <dt className="text-white/80">Mínima</dt>
          <dd>
            <span className="sr-only">{minimum.replace(/°[CF]/, temperatureUnit)}</span>
            <span aria-hidden="true">{minimum}</span>
          </dd>
        </div>
        <div>
          <dt className="text-white/80">Probabilidade de chuva</dt>
          <dd className="text-accent-300">
            <span className="sr-only">{precipitation.replace('%', 'por cento')}</span>
            <span aria-hidden="true">{precipitation}</span>
          </dd>
        </div>
      </dl>
    </li>
  );
}
