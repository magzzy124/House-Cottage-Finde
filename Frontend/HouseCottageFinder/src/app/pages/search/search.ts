import { Component, inject } from '@angular/core';
import { Card } from "../../components/card/card";
import { HouseService } from '../../services/house-service';

@Component({
  selector: 'app-search',
  imports: [Card],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  houseService = inject(HouseService);
  fetchAllCards() {
    this.houseService.fetchAllItems();
  }

}
