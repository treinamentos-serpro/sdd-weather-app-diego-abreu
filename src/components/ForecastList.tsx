import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  return (
    <section aria-label="Previsão de 5 dias" className="text-white">
      <h2 className="mb-4 text-xl font-bold">Previsão de 5 dias</h2>
      {forecast.length === 5 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {forecast.map((day, index) => (
            <ForecastCard key={day.date} day={day} index={index} unit={unit} />
          ))}
        </ul>
      ) : (
        <p role="status">A previsão completa de 5 dias está indisponível.</p>
      )}
    </section>
  );
}
