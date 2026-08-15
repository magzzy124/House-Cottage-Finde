import { effect, Injectable, signal } from '@angular/core';

interface Coordinates {
  lat: number,
  lon: number,
  bbox: number[]
}

@Injectable({
  providedIn: 'root',
})
export class SelectedLocation {
  private _selectedLocation = signal<Coordinates | null>({
    lat: 44.7866,
    lon: 20.4489,
    bbox: []
  });
  selectedLocation = this._selectedLocation.asReadonly();

  constructor() {
    effect(() => {
      console.log("Location changed:", this.selectedLocation());
    })
  }

  setSelectedLocation(cord: Coordinates) {
    this._selectedLocation.set(cord);
  }


}
