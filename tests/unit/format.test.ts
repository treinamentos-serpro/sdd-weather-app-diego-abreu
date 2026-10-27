import { describe, expect, it } from 'vitest';
import { getDayLabel, getShortDate } from '../../src/lib/format';

describe('format', () => {
  it('usa Hoje e Amanhã somente para os primeiros dias normalizados', () => {
    expect(getDayLabel('2026-10-27', 0)).toBe('Hoje');
    expect(getDayLabel('2026-10-28', 1)).toBe('Amanhã');
    expect(getDayLabel('2026-10-29', 2)).toBe('qui.');
  });

  it.each([
    [2, '2026-10-29', 'qui.'],
    [5, '2026-11-01', 'dom.'],
  ])('usa o dia da semana para o índice %s', (index, date, expected) => {
    expect(getDayLabel(date, index)).toBe(expected);
  });

  it.each([
    ['2026-10-31', 'sáb.', '31 de out.'],
    ['2026-11-01', 'dom.', '1 de nov.'],
    ['2026-12-31', 'qui.', '31 de dez.'],
    ['2027-01-01', 'sex.', '1 de jan.'],
    ['2024-02-29', 'qui.', '29 de fev.'],
    ['2026-03-08', 'dom.', '8 de mar.'],
  ])('mantém a data de calendário %s sem deslocamento de fuso', (date, weekday, shortDate) => {
    expect(getDayLabel(date, 2)).toBe(weekday);
    expect(getShortDate(date)).toBe(shortDate);
  });

  it.each([
    '',
    'inválida',
    '2026-02-29',
    '2026-13-01',
    '2026-04-31',
    '2026-1-01',
  ])('rejeita data inválida %s sem normalização silenciosa', (date) => {
    expect(() => getDayLabel(date, 0)).toThrow(RangeError);
    expect(() => getShortDate(date)).toThrow(RangeError);
  });
});
