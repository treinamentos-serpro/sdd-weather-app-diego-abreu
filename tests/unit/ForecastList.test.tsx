import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

const { forecast } = mockWeatherData;

describe('ForecastList', () => {
  it('renderiza exatamente cinco dias na ordem e com as datas recebidas', () => {
    render(<ForecastList forecast={forecast} unit="celsius" />);
    const region = screen.getByRole('region', { name: 'Previsão de 5 dias' });
    const items = within(region).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual([
      'Hoje',
      'Amanhã',
      'qui.',
      'sex.',
      'sáb.',
    ]);
    for (const [index, item] of items.entries()) {
      expect(item.querySelector('time')).toHaveAttribute('datetime', forecast[index].date);
    }
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it.each([0, 1, 4, 6])('não apresenta %s dias como previsão completa', (count) => {
    const days =
      count <= 5 ? forecast.slice(0, count) : [...forecast, { ...forecast[4], date: '2026-11-01' }];
    render(<ForecastList forecast={days} unit="celsius" />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'A previsão completa de 5 dias está indisponível.',
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('propaga a troca de unidade a todos os cartões sem modificar os dados', () => {
    const original = structuredClone(forecast);
    const { rerender } = render(<ForecastList forecast={forecast} unit="celsius" />);
    rerender(<ForecastList forecast={forecast} unit="fahrenheit" />);
    const items = screen.getAllByRole('listitem');
    for (const item of items) {
      const definitions = within(item).getAllByRole('definition');
      expect(definitions[0]).toHaveTextContent('graus Fahrenheit');
      expect(definitions[1]).toHaveTextContent('graus Fahrenheit');
      expect(definitions[2]).toHaveTextContent('por cento');
    }
    expect(forecast).toEqual(original);
  });
});
