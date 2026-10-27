const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  timeZone: 'UTC',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

function parseCalendarDate(iso: string): Date {
  const date = new Date(`${iso}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(iso) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== iso
  ) {
    throw new RangeError('Data de previsão inválida: esperado YYYY-MM-DD.');
  }
  return date;
}

/** A data já representa o calendário da cidade; UTC evita deslocá-la pelo fuso do dispositivo. */
export function getDayLabel(iso: string, index: number): string {
  const date = parseCalendarDate(iso);
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';
  return weekdayFormatter.format(date);
}

export function getShortDate(iso: string): string {
  return dateFormatter.format(parseCalendarDate(iso));
}
