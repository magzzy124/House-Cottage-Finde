import { AfterViewInit, Component, effect, inject } from '@angular/core';
import * as L from "leaflet";
import { SelectedLocation } from '../../services/selected-location';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements AfterViewInit {
  selectedLocService = inject(SelectedLocation);
  private map!: L.Map;

  createBBox(lat: number, lon: number): L.LatLngBounds {
    const latOffset = 0.000002;
    const lonOffset = 0.000007;

    return L.latLngBounds(
      [lat - latOffset, lon - lonOffset],
      [lat + latOffset, lon + lonOffset]
    );
  }

  constructor() {
    effect(() => {
      const location = this.selectedLocService.selectedLocation();
      if (location) {
        const { lat, lon } = location;
        this.map.setView([lat, lon], 1)
        const bounds = location.bbox
          ? L.latLngBounds(
            [location.bbox[1], location.bbox[0]],
            [location.bbox[3], location.bbox[2]]
          )
          : this.createBBox(location.lat, location.lon);

        this.map.fitBounds(bounds, {
          padding: [30, 30],
          maxZoom: 17
        });
      }
    })
  }

  ngAfterViewInit(): void {
    this.map = L.map("map", {
      center: [51.505, -0.09],
      zoom: 13
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      minZoom: 2,
      attribution: '© <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(this.map);

    L.marker([51.5074, -0.1278]).bindPopup('Hello world, my name is Ivan Karbashevskyi, check car4ukraine.com').addTo(this.map);
  }
}
