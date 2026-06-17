const DEFAULT_RECENT_HOURS = 24;

export function getRecentHours() {
  const raw = process.env.RADAR_RECENT_HOURS;
  const parsed = raw ? Number(raw) : DEFAULT_RECENT_HOURS;
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_RECENT_HOURS;
  return Math.min(Math.max(Math.round(parsed), 1), 168);
}

export function getRecentCutoffDate(hours = getRecentHours()) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export function getRecentCutoffIso(hours = getRecentHours()) {
  return getRecentCutoffDate(hours).toISOString();
}

export function isRecentPublishedAt(value?: string | null, hours = getRecentHours()) {
  if (!value) return false;
  const date = new Date(value);
  const time = date.getTime();
  if (!Number.isFinite(time)) return false;
  return time >= getRecentCutoffDate(hours).getTime() && time <= Date.now() + 10 * 60 * 1000;
}

export function formatRecentWindowLabel(hours = getRecentHours()) {
  if (hours === 24) return 'últimas 24h';
  if (hours < 24) return `últimas ${hours}h`;
  const days = Math.round(hours / 24);
  return `últimos ${days} dia${days === 1 ? '' : 's'}`;
}
