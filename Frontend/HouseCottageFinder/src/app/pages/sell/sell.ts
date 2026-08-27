import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sell',
  imports: [FormsModule, RouterLink],
  templateUrl: './sell.html',
  styleUrl: './sell.css',
})
export class Sell implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  title = '';
  address = '';
  city = '';
  dealType = 'For sale';
  price: number | null = null;
  bedrooms: number | null = null;
  bathrooms: number | null = null;
  area: number | null = null;
  description = '';
  imageUrl = '';

  loading = signal(false);
  error = signal('');
  success = signal(false);

  dealTypes = ['For sale', 'For rent'];

  ngOnInit() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    this.error.set('');

    if (!this.title || !this.address || !this.city || !this.price || !this.bedrooms || !this.bathrooms || !this.area) {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);

    this.http.post('/api/properties?userId=' + this.auth.currentUser()?.id, {
      title: this.title,
      address: this.address,
      city: this.city,
      dealType: this.dealType,
      price: this.price,
      bedrooms: this.bedrooms,
      bathrooms: this.bathrooms,
      area: this.area,
      latitude: 44.7866 + (Math.random() - 0.5) * 0.1,
      longitude: 20.4489 + (Math.random() - 0.5) * 0.1,
      description: this.description,
      imageUrl: this.imageUrl || 'house.jpg',
    }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/listing', res.id]), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to create listing');
      },
    });
  }
}
