import { CARTO_API_KEY, CARTO_ATTRIBUTION, cartoTileLayer } from './carto-basemap';

describe('carto-basemap', () => {
  it('should build a tile URL that carries the CARTO API key', () => {
    const layer = cartoTileLayer();
    const url = (layer as unknown as { _url: string })._url;

    expect(url).toContain('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png');
    expect(url).toContain(`key=${CARTO_API_KEY}`);
  });

  it('should support a custom style and options', () => {
    const layer = cartoTileLayer('voyager', { maxZoom: 12 });
    const url = (layer as unknown as { _url: string })._url;

    expect(url).toContain('/voyager/{z}/{x}/{y}{r}.png?key=');
    expect(layer.options.maxZoom).toBe(12);
    expect(layer.options.attribution).toBe(CARTO_ATTRIBUTION);
  });
});
