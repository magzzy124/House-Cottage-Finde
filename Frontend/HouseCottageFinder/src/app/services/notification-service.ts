import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { AuthService } from './auth-service';

export interface AppNotification {
  id: number;
  propertyId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  propertyTitle: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private api = '/api/notifications';

  private _notifications = signal<AppNotification[]>([]);
  notifications = this._notifications.asReadonly();

  private _unreadCount = signal(0);
  unreadCount = this._unreadCount.asReadonly();

  private _loading = signal(false);
  loading = this._loading.asReadonly();

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  startPolling() {
    this.loadUnreadCount();
    this.pollTimer = setInterval(() => {
      if (this.auth.isAuthenticated()) {
        this.loadUnreadCount();
      }
    }, 30000);
  }

  ngOnDestroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  loadNotifications() {
    if (!this.auth.isAuthenticated()) {
      this._notifications.set([]);
      this._unreadCount.set(0);
      return;
    }

    this._loading.set(true);
    this.http.get<AppNotification[]>(`${this.api}`).subscribe({
      next: (res) => {
        this._notifications.set(res);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  loadUnreadCount() {
    if (!this.auth.isAuthenticated()) {
      this._unreadCount.set(0);
      return;
    }

    this.http.get<{ count: number }>(`${this.api}/unread-count`).subscribe({
      next: (res) => this._unreadCount.set(res.count),
    });
  }

  markAsRead(id: number) {
    this.http.put(`${this.api}/${id}/read`, {}).subscribe({
      next: () => {
        this._notifications.update((ns) =>
          ns.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        this._unreadCount.update((c) => Math.max(0, c - 1));
      },
    });
  }

  markAllAsRead() {
    if (!this.auth.isAuthenticated()) return;

    this.http.put(`${this.api}/read-all`, {}).subscribe({
      next: () => {
        this._notifications.update((ns) => ns.map((n) => ({ ...n, isRead: true })));
        this._unreadCount.set(0);
      },
    });
  }
}
