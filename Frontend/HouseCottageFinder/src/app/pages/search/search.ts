import { Component, inject } from '@angular/core';
import { Card } from "../../components/card/card";
import { HouseService } from '../../services/house-service';
import { Map } from "../../components/map/map";
import { GeoapifyGeocoderAutocompleteModule } from "@geoapify/angular-geocoder-autocomplete";
import { SelectedLocation } from '../../services/selected-location';

@Component({
  selector: 'app-search',
  imports: [Card, Map, GeoapifyGeocoderAutocompleteModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  houseService = inject(HouseService)
  selectedLocService = inject(SelectedLocation)
  fetchAllCards() {
    this.houseService.fetchAllItems();
  }

  onPlaceSelected(feature: any) {
    console.log("selecetd feature:", feature)
    this.selectedLocService.setSelectedLocation({
      lat: feature.properties.lat, lon: feature.properties.lon
    })
  }

  onSuggestionsChange(list: any[]) {
    console.log('Suggestions:', list);
  }

}
