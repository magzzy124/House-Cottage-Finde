import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Card } from "../../components/card/card";
import { HouseService } from '../../services/house-service';
import { Map } from "../../components/map/map";
import { GeoapifyGeocoderAutocompleteModule } from "@geoapify/angular-geocoder-autocomplete";
import { SelectedLocation } from '../../services/selected-location';
import { FormsModule } from '@angular/forms';
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { SavedSearchService } from '../../services/saved-search-service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-search',
  imports: [Card, Map, GeoapifyGeocoderAutocompleteModule, FormsModule, NgxSliderModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search implements OnInit {
  houseService = inject(HouseService)
  selectedLocService = inject(SelectedLocation)
  savedSearchService = inject(SavedSearchService)
  authService = inject(AuthService)
  private router = inject(Router);

  tabs = ['m', 'km'];

  selectedTab = signal('km');
  radius = 10;

  dealTypes = ['Any', 'For rent', 'For sale'];
  selectedDealType = signal('Any');

  minBedrooms: number | null = null;
  maxBedrooms: number | null = null;
  minArea: number | null = null;
  maxArea: number | null = null;

  saveSearchName = '';
  saveSearchSuccess = signal(false);
  saveSearchError = signal('');

  formatPrice(price: number): string {
    return price >= 1000 ? `$${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k` : `$${price}`;
  }

  selectDealType(dealType: string) {
    this.selectedDealType.set(dealType);
    this.applyPriceRange();
    this.applyFilters();
  }

  value: number = 0;
  maxValue: number = 1000000;
  options: Options = {
    floor: 0,
    ceil: 1000000
  };

  ngOnInit() {
    this.applyPriceRange();
    this.applyFilters();
  }

  private applyPriceRange() {
    const isRent = this.selectedDealType() === 'For rent';

    this.options = {
      ...this.options,
      floor: 0,
      ceil: isRent ? 5000 : 1000000
    };

    this.value = 0;
    this.maxValue = isRent ? 5000 : 1000000;
  }

  applyFilters() {
    const location = this.selectedLocService.selectedLocation();
    const radiusInMeters = this.selectedTab() === 'km' ? Number(this.radius) * 1000 : Number(this.radius);

    this.houseService.setFilters({
      lat: location?.lat ?? 44.7866,
      lon: location?.lon ?? 20.4489,
      radiusKm: radiusInMeters / 1000,
      dealType: this.selectedDealType(),
      minPrice: this.value,
      maxPrice: this.maxValue,
      minBedrooms: this.minBedrooms,
      maxBedrooms: this.maxBedrooms,
      minArea: this.minArea,
      maxArea: this.maxArea,
    });
  }

  onCardClicked(id: number) {
    this.router.navigate(['/listing', id]);
  }

  selectTab(tab: string) {
    this.selectedTab.set(tab);
    this.applyFilters();
  }

  resetFilters() {
    this.selectedDealType.set('Any');
    this.selectedTab.set('km');
    this.radius = 10;
    this.minBedrooms = null;
    this.maxBedrooms = null;
    this.minArea = null;
    this.maxArea = null;
    this.applyPriceRange();
    this.selectedLocService.setSelectedLocation({
      lat: 44.7866,
      lon: 20.4489,
      bbox: []
    });
    this.applyFilters();
  }

  onPlaceSelected(feature: any) {
    console.log("selecetd feature:", feature)
    this.selectedLocService.setSelectedLocation({
      lat: feature.properties.lat, lon: feature.properties.lon, bbox: feature.bbox
    })
    this.applyFilters();
  }

  onSuggestionsChange(list: any[]) {
    console.log('Suggestions:', list);
  }

  openSaveSearchModal() {
    const modal = document.getElementById('save-search-modal') as HTMLDialogElement;
    this.saveSearchName = '';
    this.saveSearchSuccess.set(false);
    this.saveSearchError.set('');
    modal?.showModal();
  }

  closeSaveSearchModal() {
    const modal = document.getElementById('save-search-modal') as HTMLDialogElement;
    modal?.close();
  }

  saveSearch() {
    if (!this.saveSearchName.trim()) {
      this.saveSearchError.set('Please enter a name for this search');
      return;
    }

    const location = this.selectedLocService.selectedLocation();
    const radiusInMeters = this.selectedTab() === 'km' ? Number(this.radius) * 1000 : Number(this.radius);

    this.savedSearchService.saveSearch({
      name: this.saveSearchName.trim(),
      dealType: this.selectedDealType(),
      minPrice: this.value,
      maxPrice: this.maxValue,
      minBedrooms: this.minBedrooms,
      maxBedrooms: this.maxBedrooms,
      minArea: this.minArea,
      maxArea: this.maxArea,
      lat: location?.lat ?? 44.7866,
      lon: location?.lon ?? 20.4489,
      radiusKm: radiusInMeters / 1000,
    }).subscribe({
      next: () => {
        this.saveSearchSuccess.set(true);
        this.saveSearchError.set('');
        setTimeout(() => this.closeSaveSearchModal(), 1500);
      },
      error: (err) => {
        this.saveSearchError.set(err.error?.message || 'Failed to save search');
      },
    });
  }

}
