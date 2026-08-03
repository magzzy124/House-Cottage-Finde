import { TitleCasePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, TitleCasePipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('HouseCottageFinder');
  links = ["search", "sell", "about"]

  changeColor($event: Event) {
    console.log($event)
  }
}
