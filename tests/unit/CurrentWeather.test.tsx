import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import { getWeatherIcon } from '../../src/lib/weatherCodes';
import { mockWeatherData } from '../../src/mocks/weather';
import type { CurrentWeather as CurrentWeatherData, Unit } from '../../src/types/weather';

afterEach(cleanup);

const { city, current } = mockWeatherData;

describe('CurrentWeather', () => {
  it('exibe cidade, condição, temperatura hero, sensação e quatro métricas com unidades', () => {
    render(<CurrentWeather city={city} current={current} unit="celsius" />);
    const hero = screen.getByRole('region', { name: 'Clima atual' });

    expect(within(hero).getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(within(hero).getByText('São Paulo, Brasil')).toBeInTheDocument();
    expect(within(hero).getByText('Temperatura: 26 graus Celsius')).toBeInTheDocument();
    expect(within(hero).getByText('26 °C')).toBeVisible();
    expect(within(hero).getByText('Sensação térmica: 28 graus Celsius')).toBeInTheDocument();
    expect(within(hero).getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(within(hero).getByText(getWeatherIcon(current.weatherCode))).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(within(hero).getAllByRole('term')).toHaveLength(4);
    for (const [accessible, visible] of [
      ['65 por cento', '65 %'],
      ['13 quilômetros por hora', '13 km/h'],
      ['0,4 milímetros', '0,4 mm'],
      ['1015 hectopascais', '1015 hPa'],
    ]) {
      expect(within(hero).getByText(accessible)).toBeInTheDocument();
      expect(within(hero).getByText(visible)).toBeVisible();
    }
  });

  it('alterna todas as temperaturas sem alterar as métricas ou o objeto recebido', () => {
    const original = structuredClone(current);
    const { rerender } = render(<CurrentWeather city={city} current={current} unit="celsius" />);
    rerender(<CurrentWeather city={city} current={current} unit="fahrenheit" />);

    expect(screen.getByText('Temperatura: 80 graus Fahrenheit')).toBeInTheDocument();
    expect(screen.getByText('80 °F')).toBeVisible();
    expect(screen.getByText('Sensação térmica: 82 graus Fahrenheit')).toBeInTheDocument();
    expect(screen.getByText('0,4 mm')).toBeVisible();
    expect(screen.getByText('1015 hPa')).toBeVisible();
    expect(current).toEqual(original);
  });

  it('apresenta campos nulos e condição desconhecida sem substituí-los por zero', () => {
    const unavailable: CurrentWeatherData = {
      observedAt: null,
      temperatureC: null,
      feelsLikeC: null,
      weatherCode: null,
      relativeHumidity: null,
      windSpeedKmh: null,
      precipitationMm: null,
      pressureHpa: null,
    };
    render(
      <CurrentWeather city={{ ...city, admin1: null }} current={unavailable} unit="celsius" />,
    );

    expect(screen.getByText('Brasil')).toBeInTheDocument();
    expect(screen.getByText('Temperatura: Indisponível')).toBeInTheDocument();
    expect(screen.getAllByText('Sensação térmica: Indisponível')).toHaveLength(2);
    for (const definition of screen.getAllByRole('definition')) {
      expect(definition).toHaveTextContent('Indisponível');
    }
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    expect(screen.queryByText('0 °C')).not.toBeInTheDocument();
  });

  it('preserva medidas zero e permite substituir a cidade e a condição pelas props', () => {
    const { rerender } = render(<CurrentWeather city={city} current={current} unit="celsius" />);
    rerender(
      <CurrentWeather
        city={{ ...city, id: 2, name: 'Curitiba', admin1: 'Paraná' }}
        current={{
          ...current,
          temperatureC: 0,
          feelsLikeC: 0,
          relativeHumidity: 0,
          windSpeedKmh: 0,
          precipitationMm: 0,
          weatherCode: 999,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Curitiba' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'São Paulo' })).not.toBeInTheDocument();
    expect(screen.getByText('Temperatura: 0 graus Celsius')).toBeInTheDocument();
    expect(screen.getByText('0 por cento')).toBeInTheDocument();
    expect(screen.getByText('0 %')).toBeVisible();
    expect(screen.getByText('0 quilômetros por hora')).toBeInTheDocument();
    expect(screen.getByText('0 km/h')).toBeVisible();
    expect(screen.getByText('0,0 milímetros')).toBeInTheDocument();
    expect(screen.getByText('0,0 mm')).toBeVisible();
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
  });

  it('converte 0 °C em 32 °F ao alternar a unidade', async () => {
    const user = userEvent.setup();
    function WeatherUnitHarness() {
      const [unit, setUnit] = useState<Unit>('celsius');
      return (
        <>
          <UnitToggle unit={unit} onChange={setUnit} />
          <CurrentWeather
            city={city}
            current={{ ...current, temperatureC: 0, feelsLikeC: 0 }}
            unit={unit}
          />
        </>
      );
    }

    render(<WeatherUnitHarness />);
    const weather = screen.getByRole('region', { name: 'Clima atual' });
    expect(within(weather).getByText('0 °C')).toBeVisible();

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(within(weather).getByText('32 °F')).toBeVisible();
    expect(within(weather).getByText('Temperatura: 32 graus Fahrenheit')).toBeInTheDocument();
  });
});
