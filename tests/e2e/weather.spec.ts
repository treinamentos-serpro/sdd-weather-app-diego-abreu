import { expect, type Page, test } from '@playwright/test';

const city = {
  id: 3448439,
  name: 'São Paulo',
  country: 'Brasil',
  admin1: 'São Paulo',
  latitude: -23.5475,
  longitude: -46.6361,
};

async function blockUnmockedNetwork(page: Page) {
  await page.route('**/*', (route) => {
    const requestUrl = new URL(route.request().url());
    return requestUrl.origin === 'http://localhost:5173' ? route.continue() : route.abort();
  });
}

async function mockWeatherApis(page: Page) {
  await blockUnmockedNetwork(page);
  await page.clock.setFixedTime(new Date('2026-10-27T18:00:00Z'));
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
  const requests = { geocoding: 0, forecast: 0 };
  await page.route('https://geocoding-api.open-meteo.com/v1/search**', (route) => {
    requests.geocoding += 1;
    return route.fulfill({ json: { results: [city] } });
  });
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    requests.forecast += 1;
    return route.fulfill({
      json: {
        timezone: 'UTC',
        current_units: {
          time: 'unixtime',
          temperature_2m: '°C',
          apparent_temperature: '°C',
          weather_code: 'wmo code',
          relative_humidity_2m: '%',
          wind_speed_10m: 'km/h',
          precipitation: 'mm',
          pressure_msl: 'hPa',
        },
        daily_units: {
          time: 'unixtime',
          weather_code: 'wmo code',
          temperature_2m_min: '°C',
          temperature_2m_max: '°C',
          precipitation_probability_max: '%',
        },
        current: {
          time: Date.parse('2026-10-27T18:00:00Z') / 1000,
          temperature_2m: 0,
          apparent_temperature: 0,
          weather_code: 0,
          relative_humidity_2m: 50,
          wind_speed_10m: 5,
          precipitation: 0,
          pressure_msl: 1013,
        },
        daily: {
          time: [27, 28, 29, 30, 31].map(
            (day) => Date.parse(`2026-10-${day}T00:00:00Z`) / 1000,
          ),
          weather_code: [0, 1, 2, 3, 0],
          temperature_2m_min: [0, 1, 2, 3, 4],
          temperature_2m_max: [10, 11, 12, 13, 14],
          precipitation_probability_max: [0, 10, 20, 30, 40],
        },
      },
    });
  });
  return requests;
}

async function searchForCity(page: Page) {
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
}

test('busca uma cidade, exibe cinco dias e converte a temperatura para Fahrenheit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const requests = await mockWeatherApis(page);

  await page.goto('/');
  await searchForCity(page);

  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  const weather = page.getByRole('region', { name: 'Clima atual' });
  await expect(weather).toBeVisible();
  const forecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  await expect(page.getByText('Temperatura: 0 graus Celsius')).toBeAttached();
  await expect(weather.getByText('0 °C', { exact: true })).toBeVisible();
  expect(requests).toEqual({ geocoding: 1, forecast: 1 });

  await page.getByRole('button', { name: '°F', exact: true }).click();

  await expect(page.getByText('Temperatura: 32 graus Fahrenheit')).toBeAttached();
  await expect(weather.getByText('32 °F', { exact: true })).toBeVisible();
  expect(requests).toEqual({ geocoding: 1, forecast: 1 });
});

test('mostra o estado vazio quando o geocoding não inclui results', async ({ page }) => {
  await blockUnmockedNetwork(page);
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
  let forecastRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/v1/search**', (route) =>
    route.fulfill({ json: {} }),
  );
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    forecastRequests += 1;
    return route.abort();
  });

  await page.goto('/');
  await searchForCity(page);

  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  expect(forecastRequests).toBe(0);
});

test('renderiza o clima corretamente em viewport mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const requests = await mockWeatherApis(page);

  await page.goto('/');
  await searchForCity(page);

  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  const weather = page.getByRole('region', { name: 'Clima atual' });
  await expect(weather).toBeVisible();
  await expect(page.getByText('Temperatura: 0 graus Celsius')).toBeAttached();
  await expect(weather.getByText('0 °C', { exact: true })).toBeVisible();
  const forecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    )
    .toBe(true);
  expect(requests).toEqual({ geocoding: 1, forecast: 1 });
});
