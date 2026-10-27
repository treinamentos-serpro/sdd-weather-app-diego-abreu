import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...original, searchCities: vi.fn(), getWeather: vi.fn() };
});

const city = { ...mockWeatherData.city, id: 2, name: 'Lisboa', country: 'Portugal', admin1: null };
const weather = { ...mockWeatherData, city };
const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);

beforeEach(() => {
  searchMock.mockReset().mockResolvedValue([city]);
  weatherMock.mockReset().mockResolvedValue(weather);
});

afterEach(cleanup);

async function submit(name = 'Lisboa') {
  const user = userEvent.setup();
  await user.clear(screen.getByRole('searchbox'));
  await user.type(screen.getByRole('searchbox'), `${name}{Enter}`);
  return user;
}

describe('App integrado ao useWeather', () => {
  it('inicia com busca, unidade Celsius e orientação, sem mock ou rede', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'WeatherView' })).toBeVisible();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Busque uma cidade para começar' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Estado de demonstração')).not.toBeInTheDocument();
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('busca e apresenta a cidade retornada pelo serviço e os cinco dias', async () => {
    render(<App />);
    await submit();
    expect(await screen.findByRole('heading', { name: 'Lisboa' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'São Paulo' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Previsão de 5 dias' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(searchMock).toHaveBeenCalledExactlyOnceWith('Lisboa', expect.any(AbortSignal));
    expect(weatherMock).toHaveBeenCalledExactlyOnceWith(city, expect.any(AbortSignal));
    expect(screen.getByText('Exibindo o clima de Lisboa e a previsão de 5 dias.')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  it('não sai do estado inicial quando a busca é vazia', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Digite o nome de uma cidade.');
    expect(screen.getByRole('heading', { name: 'Busque uma cidade para começar' })).toBeVisible();
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('renderiza loading e empty sem dados anteriores nem retry', async () => {
    let resolve!: (cities: City[]) => void;
    render(<App />);
    await submit();
    searchMock.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    await submit('xyz');
    expect(screen.getByRole('status')).toHaveTextContent('Buscando cidades');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    await act(async () => {
      resolve([]);
    });
    expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
    expect(weatherMock).toHaveBeenCalledTimes(1);
  });

  it('apresenta erro de busca e retry por teclado, conservando foco útil', async () => {
    searchMock.mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    render(<App />);
    const user = await submit();
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível buscar cidades.');
    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede.');
    expect(screen.getByRole('searchbox')).toHaveValue('Lisboa');
    screen.getByRole('button', { name: 'Tentar novamente' }).focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('region', { name: 'Clima atual' })).toBeVisible();
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledTimes(2);
  });

  it('apresenta erro da previsão com cidade e repete somente a previsão', async () => {
    weatherMock.mockRejectedValueOnce(new WeatherServiceError('A requisição demorou demais.'));
    render(<App />);
    const user = await submit();
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível consultar o clima.');
    expect(screen.getByRole('alert')).toHaveTextContent('Lisboa, Portugal');
    expect(screen.getByRole('alert')).toHaveTextContent('A requisição demorou demais.');
    expect(screen.queryByRole('region', { name: 'Previsão de 5 dias' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('region', { name: 'Clima atual' })).toBeVisible();
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(weatherMock).toHaveBeenCalledTimes(2);
  });

  it('não mantém condições da cidade anterior quando a consulta seguinte falha', async () => {
    const nextCity: City = {
      ...city,
      id: 3,
      name: 'Coimbra',
      country: 'Portugal',
    };
    render(<App />);
    await submit('Lisboa');
    expect(screen.getByRole('region', { name: 'Clima atual' })).toBeInTheDocument();

    searchMock.mockResolvedValueOnce([nextCity]);
    weatherMock.mockRejectedValueOnce(
      new WeatherServiceError('Serviço indisponível. Tente novamente mais tarde.'),
    );
    await submit('Coimbra');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível consultar o clima.');
    expect(alert).toHaveTextContent('Coimbra, Portugal');
    expect(alert).toHaveTextContent('Serviço indisponível. Tente novamente mais tarde.');
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    expect(screen.queryByText('Temperatura: 26 graus Celsius')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Previsão de 5 dias' })).not.toBeInTheDocument();
    expect(weatherMock).toHaveBeenCalledTimes(2);
  });

  it('oferece atalho de teclado para o conteúdo principal', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute(
      'href',
      `#${main.id}`,
    );
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it('converte hero e cinco dias sem rede extra e mantém a unidade ao buscar novamente', async () => {
    const original = structuredClone(weather);
    render(<App />);
    const user = await submit();
    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(screen.getByText('Temperatura: 80 graus Fahrenheit')).toBeInTheDocument();
    const current = screen.getByRole('region', { name: 'Clima atual' });
    expect(within(current).getByText('80 °F', { exact: true })).toBeVisible();
    expect(within(current).getByText('Sensação térmica: 82 °F', { exact: true })).toBeVisible();
    const expectedForecastTemperatures = [
      ['83 °F', '65 °F'],
      ['86 °F', '66 °F'],
      ['82 °F', '69 °F'],
      ['76 °F', '66 °F'],
      ['78 °F', '64 °F'],
    ];
    for (const [index, card] of screen.getAllByRole('listitem').entries()) {
      const definitions = within(card).getAllByRole('definition');
      expect(definitions[0]).toHaveTextContent('graus Fahrenheit');
      expect(definitions[1]).toHaveTextContent('graus Fahrenheit');
      expect(within(card).getByText(expectedForecastTemperatures[index][0], { exact: true })).toBeVisible();
      expect(within(card).getByText(expectedForecastTemperatures[index][1], { exact: true })).toBeVisible();
    }
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(weatherMock).toHaveBeenCalledTimes(1);
    await submit('Porto');
    expect(screen.getByRole('button', { name: '°F', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Temperatura: 80 graus Fahrenheit')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '°C' }));
    expect(screen.getByText('Temperatura: 26 graus Celsius')).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledTimes(2);
    expect(weatherMock).toHaveBeenCalledTimes(2);
    expect(weather).toEqual(original);
  });
});
