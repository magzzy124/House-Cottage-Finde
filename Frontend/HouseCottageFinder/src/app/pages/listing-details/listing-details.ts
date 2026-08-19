import { Component, computed, inject, signal, AfterViewInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { HouseService } from '../../services/house-service';
import { IconWidget } from '../../components/icon-widget/icon-widget';
import { WidgetType } from '../../models/widgetType';

@Component({
  selector: 'app-listing-details',
  imports: [RouterLink, IconWidget],
  templateUrl: './listing-details.html',
  styleUrl: './listing-details.css',
})
export class ListingDetails implements AfterViewInit {
  houseService = inject(HouseService);
  route = inject(ActivatedRoute);

  WidgetType = WidgetType;

  listing = signal<any | null>(null);
  loaded = signal(false);

  activeImage = signal('house.jpg');

  galleryImages = computed(() => {
    const item = this.listing();
    if (!item) return [];
    const base = item.imageUrl || 'house.jpg';
    return [base, base, base, base];
  });

  private map: L.Map | null = null;

  dealColor(item: any): string {
    return item?.dealType === 'For sale' ? '#4a8dd0' : '#f59e0b';
  }

  dealBg(item: any): string {
    return item?.dealType === 'For sale' ? '#e8f1fa' : '#fdf1e2';
  }

  setActiveImage(image: string) {
    this.activeImage.set(image);
  }

  ngAfterViewInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.houseService.getProperty(id).subscribe({
      next: (res) => {
        this.listing.set(res);
        this.activeImage.set(res.imageUrl || 'house.jpg');
        this.loaded.set(true);
        this.renderMap();
      },
      error: () => this.loaded.set(true),
    });
  }

  private renderMap() {
    const item = this.listing();
    if (!item) return;

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
  }
}