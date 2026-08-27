import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

export interface RegionStats {
  city: string;
  totalListings: number;
  forSale: number;
  forRent: number;
  avgPrice: number;
  avgPricePerSqm: number;
  minPrice: number;
  maxPrice: number;
  avgArea: number;
  avgBedrooms: number;
}

export interface OverviewStats {
  totalListings: number;
  forSale: number;
  forRent: number;
  avgPrice: number;
  avgArea: number;
  avgPricePerSqm: number;
  totalCities: number;
  priceByDeal: { dealType: string; count: number; avgPrice: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private http = inject(HttpClient);

  private _regions = signal<RegionStats[]>([]);
  regions = this._regions.asReadonly();

  private _overview = signal<OverviewStats | null>(null);
  overview = this._overview.asReadonly();

  private _loading = signal(false);
  loading = this._loading.asReadonly();

  loadStats() {
    this._loading.set(true);
    this.http.get<RegionStats[]>('/api/stats/regions').subscribe({
      next: (res) => this._regions.set(res),
    });
    this.http.get<OverviewStats>('/api/stats/overview').subscribe({
      next: (res) => {
        this._overview.set(res);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }
}
