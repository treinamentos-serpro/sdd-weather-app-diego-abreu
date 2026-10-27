import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import { mockWeatherData } from '../../src/mocks/weather';
import type { ForecastDay } from '../../src/types/weather';

afterEach(cleanup);

const day: ForecastDay = {
  ...mockWeatherData.forecast[0],
  temperatureMinC: -2.5,
  temperatureMaxC: 20.5,
  precipitationProbability: 20.5,
};

function card(day: ForecastDay, unit: 'celsius' | 'fahrenheit' = 'celsius') {
  return (
    <ul>
      <ForecastCard day={day} index={0} unit={unit} />
    </ul>
  );
}

describe('ForecastCard', () => {
  it('identifica o dia e exibe condição, ícone decorativo e medidas com unidades', () => {
    render(card(day));
    const item = screen.getByRole('listitem', { name: 'Hoje, 27 de out.' });
    expect(within(item).getByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
    expect(within(item).getByText('27 de out.')).toHaveAttribute('datetime', '2026-10-27');
    expect(within(item).getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(within(item).getByText('⛅')).toHaveAttribute('aria-hidden', 'true');
    expect(
      within(item)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['Máxima', 'Mínima', 'Probabilidade de chuva']);
    expect(within(item).getByText('21 °C')).toBeVisible();
    expect(within(item).getByText('-3 °C')).toBeVisible();
    expect(within(item).getByText('21 graus Celsius')).toBeInTheDocument();
    expect(within(item).getByText('-3 graus Celsius')).toBeInTheDocument();
    expect(within(item).getByText('21 %')).toBeVisible();
    expect(within(item).getByText('21 por cento')).toBeInTheDocument();
  });

  it('converte antes de arredondar e atualiza ambas as temperaturas', () => {
    const { rerender } = render(card(day));
    rerender(card(day, 'fahrenheit'));
    expect(screen.getByText('69 °F')).toBeVisible();
    expect(screen.getByText('28 °F')).toBeVisible();
    expect(screen.getByText('69 graus Fahrenheit')).toBeInTheDocument();
    expect(screen.getByText('28 graus Fahrenheit')).toBeInTheDocument();
    expect(screen.getByText('21 %')).toBeVisible();
  });

  it('identifica medidas ausentes e condição desconhecida sem inventar valores', () => {
    render(
      card({
        ...day,
        temperatureMinC: null,
        temperatureMaxC: null,
        precipitationProbability: null,
        weatherCode: 999,
      }),
    );
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    for (const definition of screen.getAllByRole('definition')) {
      expect(definition).toHaveTextContent('Indisponível');
    }
    expect(screen.queryByText('0 %')).not.toBeInTheDocument();
  });

  it.each([0, 100])('preserva probabilidade válida %s', (probability) => {
    render(card({ ...day, precipitationProbability: probability }));
    expect(screen.getByText(`${probability} %`)).toBeVisible();
  });

  it.each([
    -1,
    101,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('não exibe probabilidade inválida %s', (probability) => {
    render(card({ ...day, precipitationProbability: probability }));
    expect(screen.getAllByRole('definition')[2]).toHaveTextContent('Indisponível');
  });
});
