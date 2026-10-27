import { describe, expect, it } from 'vitest';
import {
  convertTemperature,
  formatTemperature,
  toFahrenheit,
  unitLabel,
} from '../../src/lib/temperature';
import type { Unit } from '../../src/types/weather';

describe('temperature', () => {
  it('converte Celsius para Fahrenheit sem arredondar os dados-base', () => {
    expect(toFahrenheit(0)).toBe(32);
    expect(toFahrenheit(100)).toBe(212);
    expect(toFahrenheit(-40)).toBe(-40);
    expect(convertTemperature(26.4, 'celsius')).toBe(26.4);
    expect(convertTemperature(26.4, 'fahrenheit')).toBeCloseTo(79.52);
  });

  it.each<[number, Unit, string]>([
    [0, 'celsius', '0 °C'],
    [0, 'fahrenheit', '32 °F'],
    [26.4, 'fahrenheit', '80 °F'],
    [1.5, 'celsius', '2 °C'],
    [-1.5, 'celsius', '-2 °C'],
    [-2.5, 'celsius', '-3 °C'],
    [-0.5, 'celsius', '-1 °C'],
    [-0.1, 'celsius', '0 °C'],
    [-0, 'celsius', '0 °C'],
    [2.5, 'fahrenheit', '37 °F'],
    [(-32.5 * 5) / 9, 'fahrenheit', '-1 °F'],
  ])('formata %s °C em %s como %s', (value, unit, expected) => {
    expect(formatTemperature(value, unit)).toBe(expected);
  });

  it.each([
    null,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])('mantém %s indisponível em ambas as unidades', (value) => {
    for (const unit of ['celsius', 'fahrenheit'] as const) {
      expect(convertTemperature(value, unit)).toBeNull();
      expect(formatTemperature(value, unit)).toBe('Indisponível');
    }
  });

  it('identifica as duas unidades e trata overflow como indisponível', () => {
    expect(unitLabel('celsius')).toBe('°C');
    expect(unitLabel('fahrenheit')).toBe('°F');
    expect(formatTemperature(Number.MAX_VALUE, 'fahrenheit')).toBe('Indisponível');
  });
});
