import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-my-listings',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './my-listings.html',
  styleUrl: './my-listings.css',
})
export class MyListings implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  listings = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadListings();
  }

  loadListings() {
    this.loading.set(true);
    this.http.get<any[]>(`/api/properties/my?userId=${this.auth.currentUser()?.id}`).subscribe({
      next: (res) => {
        this.listings.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  deleteListing(id: number) {
    this.http.delete(`/api/properties/${id}?userId=${this.auth.currentUser()?.id}`).subscribe({
      next: () => {
        this.listings.update((list) => list.filter((l) => l.id !== id));
      },
    });
  }

  onCardClicked(id: number) {
    this.router.navigate(['/listing', id]);
  }

  dealColor(item: any): string {
    return item?.dealType === 'For sale' ? '#4a8dd0' : '#f59e0b';
  }

  dealBg(item: any): string {
    return item?.dealType === 'For sale' ? '#e8f1fa' : '#fdf1e2';
  }
}
