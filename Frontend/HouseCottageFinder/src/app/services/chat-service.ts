import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth-service';
import * as signalR from '@microsoft/signalr';

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

  private hubConnection: signalR.HubConnection | null = null;

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
      this._messages.update((msgs) => {
        if (msgs.some((m) => m.id === msg.id)) return msgs;
        return [...msgs, msg];
      });
    });

    await this.hubConnection.start();
    return this.hubConnection;
  }

  loadMessages(propertyId: number): void {
    if (!this.isAuthenticated()) return;

    this.http
      .get<ChatMessage[]>(`${this.api}/messages?propertyId=${propertyId}`)
      .subscribe({
        next: (res) => this._messages.set(res),
      });
  }

  startListening(propertyId: number): void {
    this.loadMessages(propertyId);

    this.ensureConnection()
      .then((connection) => connection.invoke('JoinProperty', propertyId))
      .catch(() => {});
  }

  stopListening(propertyId: number): void {
    if (this.hubConnection) {
      this.hubConnection.invoke('LeaveProperty', propertyId).catch(() => {});
    }
  }

  disconnect(): void {
    if (this.hubConnection) {
      this.hubConnection.stop().catch(() => {});
      this.hubConnection = null;
    }
    this._messages.set([]);
  }

  sendMessage(propertyId: number, content: string) {
    if (!this.isAuthenticated() || !content.trim()) return;

    this._sending.set(true);
    this.http
      .post<ChatMessage>(`${this.api}/messages`, {
        propertyId,
        content: content.trim(),
      })
      .subscribe({
        next: (msg) => {
          this._messages.update((msgs) => {
            if (msgs.some((m) => m.id === msg.id)) return msgs;
            return [...msgs, msg];
          });
          this._sending.set(false);
        },
        error: () => this._sending.set(false),
      });
  }
}
