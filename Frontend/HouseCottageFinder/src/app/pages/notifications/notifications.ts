import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { NotificationService } from '../../services/notification-service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-notifications',
  imports: [RouterLink],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  notificationService = inject(NotificationService);
  authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.notificationService.loadNotifications();
  }

  onNotificationClick(notification: { id: number; propertyId: number; isRead: boolean }) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id);
    }
    this.router.navigate(['/listing', notification.propertyId]);
  }

  markAllRead() {
    this.notificationService.markAllAsRead();
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
