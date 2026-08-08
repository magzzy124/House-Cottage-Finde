import { AfterViewInit, Component } from '@angular/core';
import * as L from "leaflet";

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements AfterViewInit {
  private map!: L.Map;
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
