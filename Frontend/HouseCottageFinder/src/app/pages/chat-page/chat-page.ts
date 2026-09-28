import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HouseService } from '../../services/house-service';
import { Chat } from '../../components/chat/chat';

interface Participant {
  id: number;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-chat-page',
  imports: [RouterLink, Chat],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.css',
})
export class ChatPage implements OnInit {
  private route = inject(ActivatedRoute);
  private houseService = inject(HouseService);
  private http = inject(HttpClient);

  listing = signal<any>(null);
  participant = signal<Participant | null>(null);
  propertyId = 0;
  withUserId = 0;

  ngOnInit() {
    this.propertyId = Number(this.route.snapshot.paramMap.get('propertyId'));
    this.withUserId = Number(this.route.snapshot.paramMap.get('userId'));

    this.houseService.getProperty(this.propertyId).subscribe({
      next: (res) => this.listing.set(res),
      error: (err) => console.error('Failed to load listing:', err),
    });

    this.http.get<Participant>(`/api/users/${this.withUserId}`).subscribe({
      next: (res) => this.participant.set(res),
      error: () => this.participant.set(null),
    });
  }
}
