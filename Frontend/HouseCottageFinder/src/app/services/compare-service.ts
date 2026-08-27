import { Injectable, signal } from '@angular/core';

export interface CompareItem {
  id: number;
  title: string;
  address: string;
  city: string;
  dealType: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
  description: string;
}

const MAX_COMPARE = 4;

@Injectable({
  providedIn: 'root',
})
export class CompareService {
  private _items = signal<CompareItem[]>([]);
  items = this._items.asReadonly();

  private _showBar = signal(false);
  showBar = this._showBar.asReadonly();

  isSelected(id: number): boolean {
    return this._items().some((i) => i.id === id);
  }

  toggle(item: any) {
    const exists = this._items().find((i) => i.id === item.id);
    if (exists) {
      this._items.update((items) => items.filter((i) => i.id !== item.id));
    } else {
      if (this._items().length >= MAX_COMPARE) return;
      this._items.update((items) => [
        ...items,
        {
          id: item.id,
          title: item.title,
          address: item.address,
          city: item.city,
          dealType: item.dealType,
          price: item.price,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
          area: item.area,
          imageUrl: item.imageUrl || 'house.jpg',
          latitude: item.latitude,
          longitude: item.longitude,
          description: item.description || '',
        },
      ]);
    }
    this._showBar.set(this._items().length > 0);
  }

  remove(id: number) {
    this._items.update((items) => items.filter((i) => i.id !== id));
    this._showBar.set(this._items().length > 0);
  }

  clear() {
    this._items.set([]);
    this._showBar.set(false);
  }

  get count() {
    return this._items().length;
  }

  get maxCompare() {
    return MAX_COMPARE;
  }
}
