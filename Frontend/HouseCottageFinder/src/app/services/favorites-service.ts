import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth-service';

export interface FavoriteItem {
  id: number;
  propertyId: number;
  createdAt: string;
  title: string;
  address: string;
  city: string;
  dealType: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private api = '/api/favorites';

  private _favoriteIds = signal<Set<number>>(new Set());
  favoriteIds = this._favoriteIds.asReadonly();

  private _favorites = signal<FavoriteItem[]>([]);
  favorites = this._favorites.asReadonly();

  private _loading = signal(false);
  loading = this._loading.asReadonly();

  private getUserId(): number | null {
    return this.auth.currentUser()?.id ?? null;
  }

  loadFavorites() {
    const userId = this.getUserId();
    if (!userId) {
      this._favorites.set([]);
      this._favoriteIds.set(new Set());
      return;
    }

    this._loading.set(true);
    this.http.get<FavoriteItem[]>(`${this.api}?userId=${userId}`).subscribe({
      next: (res) => {
        this._favorites.set(res);
        const ids = new Set(res.map((f) => f.propertyId));
        this._favoriteIds.set(ids);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  checkFavorite(propertyId: number) {
    const userId = this.getUserId();
    if (!userId) return;

    this.http
      .get<{ isFavorited: boolean }>(
        `${this.api}/check?userId=${userId}&propertyId=${propertyId}`
      )
      .subscribe({
        next: (res) => {
          this._favoriteIds.update((ids) => {
            const next = new Set(ids);
            if (res.isFavorited) {
              next.add(propertyId);
            } else {
              next.delete(propertyId);
            }
            return next;
          });
        },
      });
  }

  toggleFavorite(propertyId: number) {
    const userId = this.getUserId();
    if (!userId) return;

    const isFavorited = this._favoriteIds().has(propertyId);

    if (isFavorited) {
      this.http
        .delete(`${this.api}/${propertyId}?userId=${userId}`)
        .subscribe({
          next: () => {
            this._favoriteIds.update((ids) => {
              const next = new Set(ids);
              next.delete(propertyId);
              return next;
            });
            this._favorites.update((favs) =>
              favs.filter((f) => f.propertyId !== propertyId)
            );
          },
        });
    } else {
      this.http
        .post<{ favoriteId: number }>(
          `${this.api}/${propertyId}?userId=${userId}`,
          {}
        )
        .subscribe({
          next: () => {
            this._favoriteIds.update((ids) => {
              const next = new Set(ids);
              next.add(propertyId);
              return next;
            });
            this.loadFavorites();
          },
        });
    }
  }

  isFavorited(propertyId: number): boolean {
    return this._favoriteIds().has(propertyId);
  }
}
