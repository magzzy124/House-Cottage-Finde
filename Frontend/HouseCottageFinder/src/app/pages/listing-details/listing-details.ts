import { Component, computed, inject, signal, AfterViewInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { GalleryModule, ImageItem } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';
import { HouseService } from '../../services/house-service';
import { IconWidget } from '../../components/icon-widget/icon-widget';
import { WidgetType } from '../../models/widgetType';
import { FavoritesService } from '../../services/favorites-service';
import { AuthService } from '../../services/auth-service';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface PricePoint {
  price: number;
  date: string;
}

@Component({
  selector: 'app-listing-details',
  imports: [RouterLink, IconWidget, DecimalPipe, GalleryModule, LightboxModule],
  templateUrl: './listing-details.html',
  styleUrl: './listing-details.css',
})
export class ListingDetails implements AfterViewInit {
  houseService = inject(HouseService);
  favoritesService = inject(FavoritesService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);

  WidgetType = WidgetType;

  listing = signal<any | null>(null);
  loaded = signal(false);
  priceHistory = signal<PricePoint[]>([]);

  galleryItems = computed(() => {
    console.log("galleryitems computed")
    const item = this.listing();
    if (!item) return [];
    let urls: string[] = [];
    if (item.imageUrls && item.imageUrls.length > 0) {
      urls = item.imageUrls.split(',').filter((u: string) => u.trim());
    } else {
      urls = [item.imageUrl || 'house.jpg'];
    }
    return urls.map((url: string) => new ImageItem({ src: url, thumb: url }));
  });

  isFavorited = computed(() => {
    const item = this.listing();
    if (!item) return false;
    return this.favoritesService.isFavorited(item.id);
  });

  isLoggedIn = computed(() => this.authService.isAuthenticated());

  priceStats = computed(() => {
    const history = this.priceHistory();
    if (history.length < 2) return null;
    const first = history[0].price;
    const last = history[history.length - 1].price;
    const diff = last - first;
    const pct = first > 0 ? Math.round((diff / first) * 100) : 0;
    return { diff, pct, increased: diff > 0, decreased: diff < 0 };
  });

  private map: L.Map | null = null;

  dealColor(item: any): string {
    return item?.dealType === 'For sale' ? '#4a8dd0' : '#f59e0b';
  }

  dealBg(item: any): string {
    return item?.dealType === 'For sale' ? '#e8f1fa' : '#fdf1e2';
  }

  toggleFavorite() {
    const item = this.listing();
    if (!item || !this.isLoggedIn()) return;
    this.favoritesService.toggleFavorite(item.id);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  formatPrice(price: number): string {
    if (price >= 1000) return `$${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k`;
    return `$${price}`;
  }

  getBarHeight(price: number): number {
    const history = this.priceHistory();
    if (history.length === 0) return 0;
    const prices = history.map((p) => p.price);
    const min = Math.min(...prices) * 0.9;
    const max = Math.max(...prices) * 1.05;
    const range = max - min;
    if (range === 0) return 80;
    return 20 + ((price - min) / range) * 80;
  }

  ngAfterViewInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.houseService.getProperty(id).subscribe({
      next: (res) => {
        this.listing.set(res);
        this.loaded.set(true);
        if (this.isLoggedIn()) {
          this.favoritesService.checkFavorite(res.id);
        }
        setTimeout(() => this.renderMap(), 100);
      },
      error: () => this.loaded.set(true),
    });

    this.houseService.getPriceHistory(id).subscribe({
      next: (res) => this.priceHistory.set(res),
    });
  }

  private renderMap() {
    const item = this.listing();
    if (!item) return;

    const el = document.getElementById('listing-map');
    if (!el) return;

    this.map = L.map('listing-map', {
      center: [item.latitude, item.longitude],
      zoom: 14,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(this.map);

    L.marker([item.latitude, item.longitude])
      .addTo(this.map)
      .bindPopup(`<strong>${item.title}</strong><br>${item.address}, ${item.city}`)
      .openPopup();

    this.map.invalidateSize();
  }
}
