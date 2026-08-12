import { Component, inject, signal } from '@angular/core';
import { Card } from "../../components/card/card";
import { HouseService } from '../../services/house-service';
import { Map } from "../../components/map/map";
import { GeoapifyGeocoderAutocompleteModule } from "@geoapify/angular-geocoder-autocomplete";
import { SelectedLocation } from '../../services/selected-location';
import { FormsModule } from '@angular/forms';
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-search',
  imports: [Card, Map, GeoapifyGeocoderAutocompleteModule, FormsModule, NgxSliderModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  houseService = inject(HouseService)
  selectedLocService = inject(SelectedLocation)

  tabs = ['m', 'km'];

  selectedTab = signal('km');
  radius = 10;

  value: number = 100;
  options: Options = {
    floor: 0,
    ceil: 200
  };


  selectTab(tab: string) {
    this.selectedTab.set(tab);
  }

  fetchAllCards() {
    this.houseService.fetchAllItems();
  }

  onPlaceSelected(feature: any) {
    console.log("selecetd feature:", feature)
    this.selectedLocService.setSelectedLocation({
      lat: feature.properties.lat, lon: feature.properties.lon, bbox: feature.bbox
    })
  }

  onSuggestionsChange(list: any[]) {
    console.log('Suggestions:', list);
  }

}
