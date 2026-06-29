export const RADAR_SESSION_COOKIE = 'radar_session';

export function isRadarLoginRequired() {
  return process.env.RADAR_REQUIRE_LOGIN === 'true' || process.env.RADAR_MODE === 'private';
}

export function getRadarSessionToken() {
  return process.env.RADAR_ADMIN_TOKEN || process.env.RADAR_ADMIN_PASSWORD || '';
}

export function getRadarModeLabel() {
  return isRadarLoginRequired() ? 'Versão completa com login' : 'Versão sem login';
}
