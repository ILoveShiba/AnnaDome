export type TravelMode = 'driving' | 'transit' | 'walking' | 'bicycling';

/**
 * 根據地點名稱產生 Google Maps 搜尋連結
 */
export const buildGoogleMapsSearchUrl = (query: string): string => {
  const trimmed = query.trim();
  if (!trimmed) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
};

/**
 * 根據起點、終點與交通方式產生 Google Maps 導航路線 URL
 */
export const buildGoogleMapsDirectionUrl = (
  origin: string,
  destination: string,
  travelMode: TravelMode = 'transit'
): string => {
  const o = origin.trim();
  const d = destination.trim();
  if (!o && !d) return '';
  if (!o) return buildGoogleMapsSearchUrl(d);
  if (!d) return buildGoogleMapsSearchUrl(o);

  const params = new URLSearchParams({
    api: '1',
    origin: o,
    destination: d,
    travelmode: travelMode,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

