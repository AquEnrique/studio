
// Fetches an authoritative "now" from a public time API instead of trusting each
// device's local clock. This is what lets us stamp saves (`fechaGuardado`) with a
// timestamp that's safe to compare across different devices/browsers, even if one
// of them has a wrong or drifting system clock.
//
// Peru (America/Lima) has no daylight saving time and is fixed at UTC-5 year-round,
// which makes the local-clock fallback below reliable if every API is unreachable.
const TIME_ENDPOINTS = [
  'https://worldtimeapi.org/api/timezone/America/Lima',
  'https://timeapi.io/api/Time/current/zone?timeZone=America/Lima',
];

const PERU_UTC_OFFSET = '-05:00';

/**
 * Returns the current instant, sourced from Peru's official time, as a UTC ISO
 * string (e.g. "2026-08-08T15:04:05.000Z"). Safe to compare with `new Date(...)`
 * or plain string comparison since it's always UTC ('Z').
 */
export async function getPeruTimestamp(): Promise<string> {
  for (const url of TIME_ENDPOINTS) {
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) continue;
      const data = await response.json();

      // worldtimeapi.org already returns the datetime with the -05:00 offset baked in.
      if (typeof data?.datetime === 'string') {
        return new Date(data.datetime).toISOString();
      }

      // timeapi.io returns Lima's local wall-clock time with no offset info attached.
      if (typeof data?.dateTime === 'string') {
        return new Date(`${data.dateTime}${PERU_UTC_OFFSET}`).toISOString();
      }
    } catch (error) {
      console.warn(`No se pudo obtener la hora desde ${url}:`, error);
    }
  }

  console.warn('No se pudo obtener la hora de Perú desde ninguna API; usando el reloj local como respaldo.');
  return new Date().toISOString();
}
