import { Component, computed, effect, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat-service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy {
  propertyId = input.required<number>();

  chatService = inject(ChatService);
  authService = inject(AuthService);

  messageText = '';

  currentUserId = computed(() => this.authService.currentUser()?.id ?? 0);

  ngOnInit() {
    this.chatService.startListening(this.propertyId());
  }

  ngOnDestroy() {
    this.chatService.stopListening(this.propertyId());
  }

  isOwnMessage(senderId: number): boolean {
    return senderId === this.currentUserId();
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  send() {
    if (!this.messageText.trim() || this.chatService.sending()) return;
    this.chatService.sendMessage(this.propertyId(), this.messageText);
    this.messageText = '';
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}
