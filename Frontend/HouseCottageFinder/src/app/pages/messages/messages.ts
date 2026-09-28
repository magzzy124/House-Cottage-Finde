import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChatService, ChatThread } from '../../services/chat-service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-messages',
  imports: [RouterLink],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class Messages implements OnInit {
  chatService = inject(ChatService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  propertyFilter = signal<number | null>(null);

  threads = computed(() => {
    const filter = this.propertyFilter();
    const all = this.chatService.threads();
    return filter ? all.filter((t) => t.propertyId === filter) : all;
  });

  filteredTitle = computed(() => this.threads()[0]?.propertyTitle ?? null);

  ngOnInit() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const property = Number(this.route.snapshot.queryParamMap.get('property'));
    if (property > 0) this.propertyFilter.set(property);

    this.chatService.loadThreads().subscribe({ error: () => {} });
  }

  openThread(thread: ChatThread) {
    this.router.navigate(['/chat', thread.propertyId, thread.otherUserId]);
  }

  clearFilter() {
    this.propertyFilter.set(null);
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
