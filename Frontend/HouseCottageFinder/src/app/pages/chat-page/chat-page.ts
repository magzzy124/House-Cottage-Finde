import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HouseService } from '../../services/house-service';
import { Chat } from '../../components/chat/chat';

@Component({
  selector: 'app-chat-page',
  imports: [RouterLink, Chat],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.css',
})
export class ChatPage implements OnInit {
  private route = inject(ActivatedRoute);
  private houseService = inject(HouseService);

  listing = signal<any>(null);
  propertyId = 0;

  ngOnInit() {
    this.propertyId = Number(this.route.snapshot.paramMap.get('id'));
    this.houseService.getProperty(this.propertyId).subscribe({
      next: (res) => this.listing.set(res),
      error: (err) => console.error('Failed to load listing:', err),
    });
  }
}
