export const RADAR_TIME_ZONE = 'America/Sao_Paulo';

export function formatBrazilDateTime(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'medium' }
) {
  if (!value) return 'sem data';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'sem data';

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: RADAR_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatBrazilDateTimeWithZone(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'medium' }
) {
  const formatted = formatBrazilDateTime(value, options);
  return formatted === 'sem data' ? formatted : `${formatted} (Brasília)`;
}
