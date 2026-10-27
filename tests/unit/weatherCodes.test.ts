import { describe, expect, it } from 'vitest';
import { getWeatherIcon, getWeatherInfo, getWeatherLabel } from '../../src/lib/weatherCodes';

describe('weatherCodes', () => {
  it.each([
    [0, 'Céu limpo'],
    [1, 'Predomínio de sol'],
    [2, 'Parcialmente nublado'],
    [3, 'Nublado'],
    [45, 'Névoa'],
    [48, 'Névoa com gelo'],
    [51, 'Garoa leve'],
    [53, 'Garoa moderada'],
    [55, 'Garoa intensa'],
    [56, 'Garoa congelante leve'],
    [57, 'Garoa congelante intensa'],
    [61, 'Chuva fraca'],
    [63, 'Chuva moderada'],
    [65, 'Chuva forte'],
    [66, 'Chuva congelante leve'],
    [67, 'Chuva congelante forte'],
    [71, 'Neve fraca'],
    [73, 'Neve moderada'],
    [75, 'Neve forte'],
    [77, 'Grãos de neve'],
    [80, 'Pancadas de chuva fracas'],
    [81, 'Pancadas de chuva moderadas'],
    [82, 'Pancadas de chuva fortes'],
    [85, 'Pancadas de neve fracas'],
    [86, 'Pancadas de neve fortes'],
    [95, 'Trovoadas'],
    [96, 'Trovoadas com granizo leve'],
    [99, 'Trovoadas com granizo forte'],
  ] as const)('traduz WMO %s para %s e fornece ícone', (code, label) => {
    expect(getWeatherLabel(code)).toBe(label);
    expect(getWeatherIcon(code)).not.toBe('');
    expect(getWeatherInfo(code)).toEqual({ label, icon: getWeatherIcon(code) });
  });

  it.each([null, -1, 999, 1.5, Number.NaN])('identifica %s como condição indisponível', (code) => {
    expect(getWeatherLabel(code)).toBe('Condição indisponível');
    expect(getWeatherIcon(code)).toBe('🌡️');
  });
});
