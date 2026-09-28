import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { AuthService } from './services/auth-service';
import { FavoritesService } from './services/favorites-service';
import { CompareService } from './services/compare-service';
import { NotificationService } from './services/notification-service';
import { ChatService } from './services/chat-service';

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
  protected notificationService = inject(NotificationService);
  protected chatService = inject(ChatService);
  private router = inject(Router);

  private currentUrl = signal('');
  protected showCompareBar = computed(() => this.compareService.showBar() && this.currentUrl() !== '/compare');

  ngOnInit() {
    this.currentUrl.set(this.router.url);
    this.router.events.subscribe(() => {
      this.currentUrl.set(this.router.url);
    });
  }

  onSessionReady() {
    if (this.auth.isAuthenticated()) {
      this.favoritesService.loadFavorites();
      this.notificationService.startPolling();
      this.chatService.ensureThreads();
    }
  }

  logout() {
    this.auth.logout();
    this.favoritesService.loadFavorites();
    this.notificationService.ngOnDestroy();
    this.chatService.disconnect();
    this.router.navigate(['/login']);
  }
}
