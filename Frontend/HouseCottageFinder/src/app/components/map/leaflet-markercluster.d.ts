import * as L from 'leaflet';

declare module 'leaflet.markercluster';

declare module 'leaflet' {
  interface MarkerClusterGroupOptions {
    maxClusterRadius?: number | ((zoom: number) => number);
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    disableClusteringAtZoom?: number;
    removeOutsideVisibleBounds?: boolean;
    animate?: boolean;
    animateAddingMarkers?: boolean;
    chunkedLoading?: boolean;
    chunkInterval?: number;
    chunkDelay?: number;
    singleMarkerMode?: boolean;
    iconCreateFunction?: (cluster: MarkerCluster) => L.Icon | L.DivIcon;
  }

  interface MarkerCluster extends L.FeatureGroup {
    getChildCount(): number;
    getAllChildMarkers(): L.Marker[];
  }

  interface MarkerClusterGroup extends L.FeatureGroup {
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
    getBounds(): L.LatLngBounds;
    zoomToShowLayer(layer: L.Layer, callback?: () => void): void;
  }

  function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
}