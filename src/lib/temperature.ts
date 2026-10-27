import type { Unit } from '../types/weather';

export function toFahrenheit(celsius: number): number {
  return celsius * (9 / 5) + 32;
}

export function convertTemperature(celsius: number | null, unit: Unit): number | null {
  if (celsius === null || !Number.isFinite(celsius)) return null;
  const value = unit === 'fahrenheit' ? toFahrenheit(celsius) : celsius;
  return Number.isFinite(value) ? value : null;
}

export function unitLabel(unit: Unit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function formatTemperature(celsius: number | null, unit: Unit): string {
  const value = convertTemperature(celsius, unit);
  if (value === null) return 'Indisponível';
  const rounded = Math.sign(value) * Math.round(Math.abs(value));
  return `${Object.is(rounded, -0) ? 0 : rounded} ${unitLabel(unit)}`;
}
