export const RADAR_SESSION_COOKIE = 'radar_session';

export function normalizeRadarSecret(value: string) {
  return value.trim().replace(/^["']|["']$/g, '').trim();
}

export function isRadarLoginRequired() {
  return process.env.RADAR_REQUIRE_LOGIN === 'true' || process.env.RADAR_MODE === 'private';
}

export function isRadarEditorialLoginRequired() {
  return process.env.RADAR_PROTECT_EDITORIAL !== 'false';
}

export function getRadarSessionToken() {
  return normalizeRadarSecret(process.env.RADAR_ADMIN_TOKEN || process.env.RADAR_ADMIN_PASSWORD || '');
}

export function getRadarModeLabel() {
  if (isRadarLoginRequired()) return 'Versão completa com login';
  if (isRadarEditorialLoginRequired()) return 'Clipping aberto · Redação com login';
  return 'Versão sem login';
}
