import { AfterViewInit, Component, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import * as L from "leaflet";
import "leaflet.markercluster";
import { SelectedLocation } from '../../services/selected-location';
import { HouseService } from '../../services/house-service';
import { FavoritesService } from '../../services/favorites-service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements AfterViewInit {
  selectedLocService = inject(SelectedLocation);
  houseService = inject(HouseService);
  favoritesService = inject(FavoritesService);
  authService = inject(AuthService);
  private router = inject(Router);
  private map!: L.Map;
  private circle: L.Circle | null = null;
  private clusterGroup: L.MarkerClusterGroup | null = null;
  private markersById = new globalThis.Map<number, L.Marker>();
  private drawTimer: ReturnType<typeof setTimeout> | null = null;

  radius = input<number | string>(10);
  unit = input('km');
  private lastFitKey = '';

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
    (globalThis as any).openListing = (id: number) => this.router.navigate(['/listing', id]);
    (globalThis as any).toggleFavorite = (id: number) => {
      if (!this.authService.isAuthenticated()) return;
      const wasFav = this.favoritesService.isFavorited(id);
      this.favoritesService.toggleFavorite(id);
      const btn = document.querySelector(`button[data-fav-id="${id}"]`) as HTMLElement | null;
      if (btn) {
        const nowFav = !wasFav;
        btn.style.background = nowFav ? 'rgba(244,63,94,0.9)' : 'rgba(255,255,255,0.9)';
        const svg = btn.querySelector('svg');
        if (svg) {
          svg.style.color = nowFav ? '#fff' : '#475569';
          svg.setAttribute('fill', nowFav ? 'currentColor' : 'none');
        }
      }
    };

    effect(() => {
      const location = this.selectedLocService.selectedLocation();
      this.radius();
      this.unit();
      this.houseService.cards();

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

    effect(() => {
      const id = this.houseService.focusedPropertyId();
      if (id !== null && this.map && this.clusterGroup) {
        this.focusMarker(id);
      }
    });

    effect(() => {
      const favIds = this.favoritesService.favoriteIds();
      const popupEl = this.map?.getContainer().querySelector('.leaflet-popup');
      if (popupEl) {
        popupEl.querySelectorAll('button[data-fav-id]').forEach((btn) => {
          const propertyId = Number(btn.getAttribute('data-fav-id'));
          const nowFav = favIds.has(propertyId);
          (btn as HTMLElement).style.background = nowFav ? 'rgba(244,63,94,0.9)' : 'rgba(255,255,255,0.9)';
          const svg = btn.querySelector('svg');
          if (svg) {
            svg.style.color = nowFav ? '#fff' : '#475569';
            svg.setAttribute('fill', nowFav ? 'currentColor' : 'none');
          }
        });
      }
    });
  }

  private focusMarker(id: number) {
    const marker = this.markersById.get(id);
    if (!marker || !this.clusterGroup) {
      return;
    }

    this.clusterGroup.zoomToShowLayer(marker, () => {
      marker.openPopup();
    });
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

    const fitKey = `${lat.toFixed(6)},${lon.toFixed(6)},${this.radiusInMeters()}`;
    if (fitKey !== this.lastFitKey) {
      this.lastFitKey = fitKey;
      this.map.fitBounds(this.circle.getBounds(), {
        padding: [30, 30],
        maxZoom: 17,
        animate: true,
        duration: 0.6,
        easeLinearity: 0.25
      });
    }

    this.drawMarkersInside(lat, lon);
  }

  private createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
    const count = cluster.getChildCount();
    const size = count >= 100 ? 52 : count >= 10 ? 44 : 36;

    return L.divIcon({
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      html: `<div style="width:${size}px;height:${size}px;line-height:${size}px;text-align:center;background:#2563eb;color:#fff;border-radius:50%;font-weight:700;font-family:'DM Sans',sans-serif;font-size:${count >= 100 ? 15 : 13}px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${count}</div>`
    });
  }

  private drawMarkersInside(lat: number, lon: number) {
    if (!this.clusterGroup) {
      return;
    }

    this.clusterGroup.clearLayers();
    this.markersById.clear();

    const radiusMeters = this.radiusInMeters();
    const center = L.latLng(lat, lon);

    for (const card of this.houseService.cards()) {
      const position = L.latLng(card.latitude, card.longitude);
      if (center.distanceTo(position) > radiusMeters) {
        continue;
      }

      const marker = L.marker(position, {
        icon: L.divIcon({
          className: '',
          iconSize: [30, 40],
          iconAnchor: [15, 40],
          popupAnchor: [0, -40],
          html: `<div style="position:relative;width:30px;height:40px">
            <svg viewBox="0 0 30 40" width="30" height="40" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="${card.dealType === 'For sale' ? '#4a8dd0' : '#f59e0b'}" stroke="#fff" stroke-width="2"/>
              <circle cx="15" cy="14" r="6" fill="#fff"/>
            </svg>
          </div>`
        }),
      }).bindPopup(() => this.buildPopupContent(card), {
        maxWidth: 800,
        minWidth: 200
      });

      this.markersById.set(card.id, marker);
      this.clusterGroup.addLayer(marker);
    }

    const focusedId = this.houseService.focusedPropertyId();
    if (focusedId !== null) {
      this.focusMarker(focusedId);
    }
  }

  private buildPopupContent(card: any): string {
    const image = card.imageUrl || 'house.jpg';
    const dealColor = card.dealType === 'For sale' ? '#4a8dd0' : '#f59e0b';
    const isLoggedIn = this.authService.isAuthenticated();
    const isFav = this.favoritesService.isFavorited(card.id);
    const favBg = isFav ? 'rgba(244,63,94,0.9)' : 'rgba(255,255,255,0.9)';
    const favColor = isFav ? '#fff' : '#475569';
    const favFill = isFav ? 'currentColor' : 'none';

    const heartButton = isLoggedIn
      ? `<button data-fav-id="${card.id}" onclick="window.toggleFavorite(${card.id});event.stopPropagation()" style="position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;background:${favBg};box-shadow:0 2px 6px rgba(0,0,0,0.15);transition:all 0.2s" title="Favorite">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${favFill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" style="color:${favColor}">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>`
      : `<div style="position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.9);box-shadow:0 2px 6px rgba(0,0,0,0.15)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" style="color:#475569;opacity:0.4">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </div>`;

    return `
      <div style="display:flex;width:max-content;background:#fff;border-radius:20px;box-shadow:0 8px 25px rgba(0,0,0,0.12);font-family:'DM Sans',sans-serif">
        <div style="position:relative;width:140px;height:140px;flex-shrink:0;border-radius:20px;background-image:url('${image}');background-size:cover;background-position:center">
          ${heartButton}
        </div>
        <div style="display:flex;flex-direction:column;justify-content:space-around;padding:8px 14px;width:max-content;min-width:0;border-radius:20px">
          <div style="display:flex;align-items:center;gap:10px;width:max-content">
            <h1 style="font-size:24px;font-weight:900;color:#0f172a;margin:0;white-space:nowrap">$ ${card.price}</h1>
            <span style="color:${dealColor};font-size:15px;font-weight:700;white-space:nowrap">${card.dealType}</span>
          </div>
          <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:0;white-space:nowrap">${card.address},${card.city}</h2>
          <div style="display:flex;gap:8px;width:max-content">
            ${this.buildWidget(card.bedrooms, 'bedroom')}
            ${this.buildWidget(card.bathrooms, 'bathroom')}
            ${this.buildWidget(card.area, 'surface')}
          </div>
          <button onclick="window.openListing(${card.id})" style="width:max-content;background:#4a8dd0;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:14px;font-weight:600;cursor:pointer;margin-top:4px">View details</button>
        </div>
      </div>`;
  }

  private buildWidget(count: number, type: string): string {
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:#f3f3f3;border-radius:15px;width:max-content">
        <img src="${type}.svg" alt="${type}" style="width:22px;height:22px" />
        <span style="font-weight:700;color:#0f172a">${count}</span>
      </div>`;
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

    this.clusterGroup = L.markerClusterGroup({
      iconCreateFunction: (cluster) => this.createClusterIcon(cluster),
      showCoverageOnHover: false,
      maxClusterRadius: 60
    });
    this.clusterGroup.addTo(this.map);

    const location = this.selectedLocService.selectedLocation();
    if (location) {
      this.drawCircle(location.lat, location.lon);
    }
  }
}
