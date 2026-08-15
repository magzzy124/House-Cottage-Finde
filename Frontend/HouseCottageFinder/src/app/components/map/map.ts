import { AfterViewInit, Component, effect, inject, input } from '@angular/core';
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
  private circle: L.Circle | null = null;
  private drawTimer: ReturnType<typeof setTimeout> | null = null;

  radius = input<number | string>(10);
  unit = input('km');

  radiusInMeters(): number {
    const value = Number(this.radius());
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }
    return this.unit() === 'km' ? value * 1000 : value;
  }

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
      this.radius();
      this.unit();

      if (this.map && location) {
        if (this.drawTimer) {
          clearTimeout(this.drawTimer);
        }
        this.drawTimer = setTimeout(() => {
          const radiusMeters = this.radiusInMeters();
          if (radiusMeters > 0) {
            this.drawCircle(location.lat, location.lon);
          }
        }, 300);
      }
    })
  }

  private drawCircle(lat: number, lon: number) {
    if (this.circle) {
      this.circle.remove();
    }
    this.circle = L.circle([lat, lon], {
      radius: this.radiusInMeters(),
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      interactive: false,
    }).addTo(this.map);

    this.map.fitBounds(this.circle.getBounds(), {
      padding: [30, 30],
      maxZoom: 17,
      animate: true,
      duration: 0.6,
      easeLinearity: 0.25
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map("map", {
      center: [44.7866, 20.4489],
      zoom: 12
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      minZoom: 2,
      attribution: '© <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(this.map);


    const location = this.selectedLocService.selectedLocation();
    if (location) {
      this.drawCircle(location.lat, location.lon);
    }
  }
}
