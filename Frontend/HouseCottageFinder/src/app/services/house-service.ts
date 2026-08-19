import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';

export interface PropertyFilters {
  lat: number;
  lon: number;
  radiusKm: number;
  dealType: string;
  minPrice: number | null;
  maxPrice: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class HouseService {
  private http = inject(HttpClient);

  private _cardItems = signal<any[]>([]);
  cards = this._cardItems.asReadonly();

  private _focusedPropertyId = signal<number | null>(null);
  focusedPropertyId = this._focusedPropertyId.asReadonly();

  private filters = signal<PropertyFilters>({
    lat: 44.7866,
    lon: 20.4489,
    radiusKm: 10,
    dealType: 'Any',
    minPrice: null,
    maxPrice: null,
  });

  private fetchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      this.filters();
      this.fetch();
    });
  }

  setFilters(partial: Partial<PropertyFilters>) {
    this.filters.update((f) => ({ ...f, ...partial }));
  }

  focusProperty(id: number) {
    this._focusedPropertyId.set(null);
    this._focusedPropertyId.set(id);
  }

  getProperty(id: number) {
    return this.http.get<any>(`/api/properties/${id}`);
  }

  private fetch() {
    if (this.fetchTimer) {
      clearTimeout(this.fetchTimer);
    }
    this.fetchTimer = setTimeout(() => {
      const f = this.filters();
      const params: Record<string, string | number> = {
        lat: f.lat,
        lon: f.lon,
        radius: f.radiusKm,
      };

      if (f.dealType !== 'Any') {
        params['dealType'] = f.dealType;
      }
      if (f.minPrice !== null) {
        params['minPrice'] = f.minPrice;
      }
      if (f.maxPrice !== null) {
        params['maxPrice'] = f.maxPrice;
      }

      this.http.get('/api/properties', { params }).subscribe({
        next: (res) => this._cardItems.set(res as any[]),
        error: (err) => console.error(err),
      });
    }, 150);
  }
}