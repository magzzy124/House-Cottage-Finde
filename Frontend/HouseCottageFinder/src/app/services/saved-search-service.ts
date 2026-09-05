import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth-service';

export interface SavedSearch {
  id: number;
  userId: number;
  name: string | null;
  dealType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minBedrooms: number | null;
  maxBedrooms: number | null;
  minArea: number | null;
  maxArea: number | null;
  lat: number | null;
  lon: number | null;
  radiusKm: number | null;
  createdAt: string;
}

export interface SaveSearchPayload {
  name: string;
  dealType: string;
  minPrice: number;
  maxPrice: number;
  minBedrooms: number | null;
  maxBedrooms: number | null;
  minArea: number | null;
  maxArea: number | null;
  lat: number;
  lon: number;
  radiusKm: number;
}

@Injectable({
  providedIn: 'root',
})
export class SavedSearchService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private api = '/api/saved-searches';

  private _searches = signal<SavedSearch[]>([]);
  searches = this._searches.asReadonly();

  private _loading = signal(false);
  loading = this._loading.asReadonly();

  private getUserId(): number | null {
    return this.auth.currentUser()?.id ?? null;
  }

  loadSearches() {
    const userId = this.getUserId();
    if (!userId) {
      this._searches.set([]);
      return;
    }

    this._loading.set(true);
    this.http.get<SavedSearch[]>(`${this.api}?userId=${userId}`).subscribe({
      next: (res) => {
        this._searches.set(res);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  saveSearch(payload: SaveSearchPayload) {
    const userId = this.getUserId()!;
    return this.http.post<{ id: number; message: string }>(
      `${this.api}?userId=${userId}`,
      payload
    );
  }

  deleteSearch(id: number) {
    return this.http.delete(`${this.api}/${id}`).subscribe({
      next: () => {
        this._searches.update((s) => s.filter((item) => item.id !== id));
      },
    });
  }
}
