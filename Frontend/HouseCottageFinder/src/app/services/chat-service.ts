import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { AuthService } from './auth-service';
import * as signalR from '@microsoft/signalr';

export interface ChatMessage {
  id: number;
  propertyId: number;
  senderId: number;
  recipientId: number;
  senderName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface ChatThread {
  propertyId: number;
  otherUserId: number;
  otherName: string;
  propertyTitle: string;
  propertyImage: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
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

  private _threads = signal<ChatThread[]>([]);
  threads = this._threads.asReadonly();

  private _loadingThreads = signal(false);
  loadingThreads = this._loadingThreads.asReadonly();

  private threadsLoaded = false;

  private hubConnection: signalR.HubConnection | null = null;

  private currentConversation: { propertyId: number; withUserId: number } | null = null;

  unreadTotal = computed(() => this._threads().reduce((sum, t) => sum + t.unreadCount, 0));

  private isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  private async ensureConnection(): Promise<signalR.HubConnection> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection;
    }

    if (this.hubConnection) {
      await this.hubConnection.stop();
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/chat', {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hubConnection.on('ReceiveMessage', (msg: ChatMessage) => {
      const isOpen =
        this.currentConversation &&
        this.currentConversation.propertyId === msg.propertyId &&
        (this.currentConversation.withUserId === msg.senderId ||
          this.currentConversation.withUserId === msg.recipientId);

      if (isOpen) {
        this._messages.update((msgs) => {
          if (msgs.some((m) => m.id === msg.id)) return msgs;
          return [...msgs, msg];
        });
      }

      this.refreshThreads();
    });

    await this.hubConnection.start();
    return this.hubConnection;
  }

  loadThreads(propertyId?: number): Observable<ChatThread[]> {
    if (!this.isAuthenticated()) return of([]);

    const url = propertyId
      ? `${this.api}/threads?propertyId=${propertyId}`
      : `${this.api}/threads`;

    this._loadingThreads.set(true);

    return this.http.get<ChatThread[]>(url).pipe(
      tap({
        next: (res) => {
          this._threads.set(res);
          this.threadsLoaded = true;
          this._loadingThreads.set(false);
        },
        error: () => this._loadingThreads.set(false),
      }),
    );
  }

  ensureThreads(): void {
    if (this.threadsLoaded || !this.isAuthenticated()) return;
    this.loadThreads().subscribe({ error: () => {} });
  }

  refreshThreads(): void {
    if (!this.threadsLoaded || !this.isAuthenticated()) return;
    this.loadThreads().subscribe({ error: () => {} });
  }

  clearThreads(): void {
    this._threads.set([]);
    this.threadsLoaded = false;
  }

  loadMessages(propertyId: number, withUserId: number): void {
    if (!this.isAuthenticated()) return;

    this.http
      .get<ChatMessage[]>(`${this.api}/messages?propertyId=${propertyId}&withUserId=${withUserId}`)
      .subscribe({
        next: (res) => {
          this._messages.set(res);
          this.refreshThreads();
        },
      });
  }

  startListening(propertyId: number, withUserId: number): void {
    this.currentConversation = { propertyId, withUserId };
    this._messages.set([]);
    this.loadMessages(propertyId, withUserId);

    this.ensureConnection()
      .then((connection) => connection.invoke('JoinConversation', propertyId, withUserId))
      .catch(() => {});
  }

  stopListening(propertyId: number, withUserId: number): void {
    this.currentConversation = null;
    if (this.hubConnection) {
      this.hubConnection.invoke('LeaveConversation', propertyId, withUserId).catch(() => {});
    }
  }

  disconnect(): void {
    if (this.hubConnection) {
      this.hubConnection.stop().catch(() => {});
      this.hubConnection = null;
    }
    this._messages.set([]);
    this.clearThreads();
  }

  sendMessage(propertyId: number, recipientId: number, content: string) {
    if (!this.isAuthenticated() || !content.trim()) return;

    this._sending.set(true);
    this.http
      .post<ChatMessage>(`${this.api}/messages`, {
        propertyId,
        recipientId,
        content: content.trim(),
      })
      .subscribe({
        next: (msg) => {
          this._messages.update((msgs) => {
            if (msgs.some((m) => m.id === msg.id)) return msgs;
            return [...msgs, msg];
          });
          this._sending.set(false);
          this.refreshThreads();
        },
        error: () => this._sending.set(false),
      });
  }
}
