import * as L from 'leaflet';

export const CARTO_API_KEY = 'cb1_3zp3_1_01da9ecfe2335bb6f9cde21a';

const CARTO_BASEMAPS = 'https://{s}.basemaps.cartocdn.com';

export const CARTO_ATTRIBUTION =
  '© <a href="https://carto.com/attributions">CARTO</a>, ' +
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function cartoTileLayer(
  style = 'light_all',
  options: L.TileLayerOptions = {}
): L.TileLayer {
  return L.tileLayer(`${CARTO_BASEMAPS}/${style}/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`, {
    maxZoom: 19,
    attribution: CARTO_ATTRIBUTION,
    ...options,
  });
}
