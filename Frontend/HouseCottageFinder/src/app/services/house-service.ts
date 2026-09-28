import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, EMPTY, map, switchMap } from 'rxjs';

export interface PropertyFilters {
  lat: number;
  lon: number;
  radiusKm: number;
  dealType: string;
  minPrice: number | null;
  maxPrice: number | null;
  minBedrooms: number | null;
  maxBedrooms: number | null;
  minArea: number | null;
  maxArea: number | null;
  minPlotSize: number | null;
  maxPlotSize: number | null;
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
    minBedrooms: null,
    maxBedrooms: null,
    minArea: null,
    maxArea: null,
    minPlotSize: null,
    maxPlotSize: null,
  });

  constructor() {
    toObservable(this.filters)
      .pipe(
        debounceTime(150),
        map((f) => this.buildParams(f)),
        switchMap((params) =>
          this.http.get<any[]>('/api/properties', { params }).pipe(
            catchError((err) => {
              console.error(err);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((res) => this._cardItems.set(res));
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

  getPriceHistory(id: number) {
    return this.http.get<{ price: number; date: string }[]>(`/api/properties/${id}/price-history`);
  }

  private buildParams(f: PropertyFilters): Record<string, string | number> {
    const params: Record<string, string | number> = {
      lat: f.lat,
      lon: f.lon,
      radius: f.radiusKm,
    };

    const setIfPresent = (key: string, value: number | null) => {
      if (value !== null) {
        params[key] = value;
      }
    };

    if (f.dealType !== 'Any') {
      params['dealType'] = f.dealType;
    }
    if (f.minPrice !== null && f.minPrice > 0) {
      params['minPrice'] = f.minPrice;
    }
    if (f.maxPrice !== null && f.maxPrice < 1000000) {
      params['maxPrice'] = f.maxPrice;
    }
    setIfPresent('minBedrooms', f.minBedrooms);
    setIfPresent('maxBedrooms', f.maxBedrooms);
    setIfPresent('minArea', f.minArea);
    setIfPresent('maxArea', f.maxArea);
    setIfPresent('minPlotSize', f.minPlotSize);
    setIfPresent('maxPlotSize', f.maxPlotSize);

    return params;
  }
}
