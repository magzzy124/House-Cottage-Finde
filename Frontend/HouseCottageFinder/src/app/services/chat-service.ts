import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth-service';

export interface ChatMessage {
  id: number;
  propertyId: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private api = '/api/chat';

  private _messages = signal<ChatMessage[]>([]);
  messages = this._messages.asReadonly();

  private _sending = signal(false);
  sending = this._sending.asReadonly();

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  private getUserId(): number | null {
    return this.auth.currentUser()?.id ?? null;
  }

  loadMessages(propertyId: number) {
    const userId = this.getUserId();
    if (!userId) return;

    this.http
      .get<ChatMessage[]>(`${this.api}/messages?propertyId=${propertyId}&userId=${userId}`)
      .subscribe({
        next: (res) => this._messages.set(res),
      });
  }

  startPolling(propertyId: number) {
    this.stopPolling();
    this.loadMessages(propertyId);
    this.pollTimer = setInterval(() => this.loadMessages(propertyId), 5000);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this._messages.set([]);
  }

  sendMessage(propertyId: number, content: string) {
    const userId = this.getUserId();
    if (!userId || !content.trim()) return;

    this._sending.set(true);
    this.http
      .post<ChatMessage>(`${this.api}/messages?userId=${userId}`, {
        propertyId,
        content: content.trim(),
      })
      .subscribe({
        next: (msg) => {
          this._messages.update((msgs) => [...msgs, msg]);
          this._sending.set(false);
        },
        error: () => this._sending.set(false),
      });
  }
}
