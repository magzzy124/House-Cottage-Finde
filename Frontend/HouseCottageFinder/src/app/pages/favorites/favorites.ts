import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FavoritesService } from '../../services/favorites-service';
import { AuthService } from '../../services/auth-service';
import { Card } from '../../components/card/card';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink, Card],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class Favorites implements OnInit {
  favoritesService = inject(FavoritesService);
  authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.favoritesService.loadFavorites();
  }

  onCardClicked(id: number) {
    this.router.navigate(['/listing', id]);
  }
}
