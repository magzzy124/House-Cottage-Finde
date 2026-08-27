import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { AuthService } from './services/auth-service';
import { FavoritesService } from './services/favorites-service';
import { CompareService } from './services/compare-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, TitleCasePipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('HouseCottageFinder');
  links = ["search", "sell", "stats", "about"]

  protected auth = inject(AuthService);
  private favoritesService = inject(FavoritesService);
  protected compareService = inject(CompareService);
  private router = inject(Router);

  private currentUrl = signal('');
  protected showCompareBar = computed(() => this.compareService.showBar() && this.currentUrl() !== '/compare');

  ngOnInit() {
    this.currentUrl.set(this.router.url);
    this.router.events.subscribe(() => {
      this.currentUrl.set(this.router.url);
    });
    if (this.auth.isAuthenticated()) {
      this.favoritesService.loadFavorites();
    }
  }

  logout() {
    this.auth.logout();
    this.favoritesService.loadFavorites();
    this.router.navigate(['/login']);
  }
}
