import { expect, type Page, test } from '@playwright/test';
import { mockWeatherData } from '../../src/mocks/weather';

async function search(page: Page, name = 'São Paulo') {
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill(name);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
}

async function showSuccess(page: Page) {
  await search(page);
  await expect(page.getByRole('region', { name: 'Clima atual' })).toBeVisible();
}

async function checkStates(page: Page, check: (state: string) => Promise<void>) {
  await check('idle');
  await search(page, 'vazio');
  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  await check('empty');
  await search(page, 'erro');
  await expect(page.getByRole('alert')).toBeVisible();
  await check('error');
  await showSuccess(page);
  await check('success');

  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    const name = new URL(route.request().url()).searchParams.get('name');
    if (name !== 'lento') {
      await route.fallback();
      return;
    }
    await pending;
    await route.fulfill({ json: { results: [mockWeatherData.city] } });
  });
  await search(page, 'lento');
  await expect(page.getByRole('status')).toHaveText(/Buscando cidades/);
  try {
    await check('loading');
  } finally {
    release();
  }
  await expect(page.getByRole('region', { name: 'Clima atual' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => {
    const requestUrl = new URL(route.request().url());
    return requestUrl.origin === 'http://localhost:5173' ? route.continue() : route.abort();
  });
  await page.clock.setFixedTime(new Date('2026-10-27T18:00:00Z'));
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    const name = new URL(route.request().url()).searchParams.get('name');
    return route.fulfill({
      status: name === 'erro' ? 500 : 200,
      json: { results: name === 'vazio' ? [] : [mockWeatherData.city] },
    });
  });
  await page.route('https://api.open-meteo.com/**', (route) => {
    const { current, forecast, timezone } = mockWeatherData;
    return route.fulfill({
      json: {
        timezone,
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
          temperature_2m: current.temperatureC,
          apparent_temperature: current.feelsLikeC,
          weather_code: current.weatherCode,
          relative_humidity_2m: current.relativeHumidity,
          wind_speed_10m: current.windSpeedKmh,
          precipitation: current.precipitationMm,
          pressure_msl: current.pressureHpa,
        },
        daily: {
          time: forecast.map((day) => Date.parse(`${day.date}T03:00:00Z`) / 1000),
          weather_code: forecast.map((day) => day.weatherCode),
          temperature_2m_min: forecast.map((day) => day.temperatureMinC),
          temperature_2m_max: forecast.map((day) => day.temperatureMaxC),
          precipitation_probability_max: forecast.map((day) => day.precipitationProbability),
        },
      },
    });
  });
});

for (const width of [320, 375, 640, 768, 1024, 1280]) {
  test(`layout sem transbordamento em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await checkStates(page, async () => {
      await expect
        .poll(() =>
          page.evaluate(() => {
            return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
          }),
        )
        .toBe(true);
    });
    const forecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
    await expect(forecast).toBeVisible();
    const forecastList = forecast.getByRole('list');
    await expect(forecastList).toBeVisible();
    const columns = await forecastList.evaluate((element) => {
      return getComputedStyle(element).gridTemplateColumns.split(' ').length;
    });
    expect(columns).toBe(width >= 1024 ? 5 : width >= 640 ? 3 : 2);
    await page.getByRole('button', { name: '°F', exact: true }).click();
    const currentWeather = page.getByRole('region', { name: 'Clima atual' });
    await expect(
      page.getByText('Temperatura: 80 graus Fahrenheit', { exact: true }),
    ).toBeAttached();
    await expect(currentWeather.getByText('80 °F', { exact: true })).toBeVisible();
    const overflowing = await page.locator('main *').evaluateAll((elements) => {
      return elements
        .filter((element) => {
          const style = getComputedStyle(element);
          return (
            style.position !== 'absolute' &&
            element.clientWidth > 0 &&
            element.scrollWidth > element.clientWidth + 1
          );
        })
        .map((element) => `${element.tagName}: ${element.textContent?.trim().slice(0, 60)}`);
    });
    expect(overflowing).toEqual([]);
  });
}

test('atalho de teclado leva ao conteúdo e retry conserva um foco útil', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await search(page, 'erro');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [mockWeatherData.city] } }),
  );
  await page.getByRole('button', { name: 'Tentar novamente' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await expect(
    page.getByText('Exibindo o clima de São Paulo e a previsão de 5 dias.', { exact: true }),
  ).toBeAttached();
});

test('campo e botão de busca têm alvos de pelo menos 44px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 667 });
  await page.goto('/');
  for (const control of [
    page.getByRole('searchbox', { name: 'Buscar cidade' }),
    page.getByRole('button', { name: 'Buscar', exact: true }),
  ]) {
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
});

test('reflow com texto a 200% e movimento reduzido', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  await checkStates(page, async (state) => {
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
    if (state === 'loading') {
      const animation = await page
        .getByRole('status')
        .locator('[aria-hidden]')
        .evaluate((element) => {
          return getComputedStyle(element).animationName;
        });

      expect(animation).toBe('none');
    }
  });
});

test('unidades permitem teclado e foco visível', async ({ page }) => {
  await page.goto('/');
  await showSuccess(page);
  const celsius = page.getByRole('button', { name: '°C', exact: true });
  const fahrenheit = page.getByRole('button', { name: '°F', exact: true });
  await celsius.focus();
  await page.keyboard.press('Tab');
  await expect(fahrenheit).toBeFocused();
  const focusStyle = await fahrenheit.evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
  });
  expect(focusStyle.width).toBeGreaterThanOrEqual(2);
  expect(focusStyle.style).toBe('solid');
  await page.keyboard.press('Space');
  await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Shift+Tab');
  await expect(celsius).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(celsius).toHaveAttribute('aria-pressed', 'true');
});

test('contraste da paleta mantém texto em 4,5:1 e controles em 3:1 sobre glass', async ({
  page,
}) => {
  await page.goto('/');
  await showSuccess(page);
  const [accentColor, termColor, placeholderColor, buttonColors, borderColor] = await Promise.all([
    page.getByRole('link', { name: 'Open-Meteo' }).evaluate((element) => {
      return getComputedStyle(element).color;
    }),
    page.getByRole('term').first().evaluate((element) => getComputedStyle(element).color),
    page
      .getByRole('searchbox', { name: 'Buscar cidade' })
      .evaluate((element) => getComputedStyle(element, '::placeholder').color),
    page.getByRole('button', { name: 'Buscar', exact: true }).evaluate((element) => {
      const style = getComputedStyle(element);
      return { text: style.color, background: style.backgroundColor };
    }),
    page
      .getByRole('searchbox', { name: 'Buscar cidade' })
      .evaluate((element) => getComputedStyle(element.parentElement!).borderTopColor),
  ]);
  const colors = {
    accent: rgb(accentColor),
    text: rgb(termColor),
    placeholder: rgb(placeholderColor),
    buttonText: rgb(buttonColors.text),
    buttonBackground: rgb(buttonColors.background),
    border: rgb(borderColor),
  };
  function blend(foreground: number[], background: number[]) {
    const alpha = foreground[3] ?? 1;
    return background
      .slice(0, 3)
      .map((value, index) => foreground[index] * alpha + value * (1 - alpha));
  }
  function luminance(color: number[]) {
    return color
      .slice(0, 3)
      .map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  }
  function contrast(first: number[], second: number[]) {
    const a = luminance(first);
    const b = luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }
  // Superpõe os máximos dos dois gradientes e duas superfícies glass: limite conservador.
  let background = [11, 16, 32];
  for (const layer of [
    [109, 124, 255, 0.18],
    [139, 155, 255, 0.12],
    [255, 255, 255, 0.05],
    [255, 255, 255, 0.05],
  ]) {
    background = blend(layer, background);
  }
  for (const color of [colors.accent, colors.text, colors.placeholder]) {
    expect(contrast(blend(color, background), background)).toBeGreaterThanOrEqual(4.5);
  }
  expect(contrast(colors.buttonText, colors.buttonBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(blend(colors.border, background), background)).toBeGreaterThanOrEqual(3);
});

function rgb(value: string) {
  const channels = value.match(/[\d.]+/g);
  if (!channels) throw new Error(`Cor CSS não reconhecida: ${value}`);
  return channels.map(Number);
}
