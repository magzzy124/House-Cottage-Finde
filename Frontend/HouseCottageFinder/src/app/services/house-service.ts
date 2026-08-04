import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HouseService {
  private http = inject(HttpClient);

  private _cardItems = signal<any>([]);
  cards = this._cardItems.asReadonly();

  constructor() {
    this.fetchAllItems();
  }

  fetchAllItems() {
    this.http.get("https://77142c87-462f-435c-b0ce-a76b9b4cc9c5.mock.pstmn.io/allCards").subscribe({
      next: (res) => this._cardItems.set(res),
      error: (err) => console.error(err)
    })
  }

}
