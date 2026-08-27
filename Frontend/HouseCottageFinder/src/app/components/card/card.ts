import { Component, computed, inject, input, output } from '@angular/core';
import { IconWidget } from "../icon-widget/icon-widget";
import { WidgetType, TagType } from '../../models/widgetType';
import { IconTag } from "../icon-tag/icon-tag";
import { FavoritesService } from '../../services/favorites-service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-card',
  imports: [IconWidget, IconTag],
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card {
  cardDetails = input<any>();
  clicked = output<number>();
  WidgetType = WidgetType
  TagType = TagType

  favoritesService = inject(FavoritesService);
  authService = inject(AuthService);

  dealType = computed(() => this.cardDetails()?.dealType ?? 'For sale');
  dealColor = computed(() => this.dealType() === 'For sale' ? '#4a8dd0' : '#f59e0b');
  dealBg = computed(() => this.dealType() === 'For sale' ? '#e8f1fa' : '#fdf1e2');
  cardImage = computed(() => this.cardDetails()?.imageUrl || 'house.jpg');
  isFavorited = computed(() => this.favoritesService.isFavorited(this.cardDetails()?.id));
  isLoggedIn = computed(() => this.authService.isAuthenticated());

  onClick() {
    this.clicked.emit(this.cardDetails()?.id);
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (!this.isLoggedIn()) return;
    this.favoritesService.toggleFavorite(this.cardDetails()?.id);
  }
}
