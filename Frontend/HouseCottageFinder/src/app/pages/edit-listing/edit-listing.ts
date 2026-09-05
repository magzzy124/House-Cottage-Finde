import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { HttpClient } from '@angular/common/http';
import { GeoapifyGeocoderAutocompleteModule } from '@geoapify/angular-geocoder-autocomplete';

@Component({
  selector: 'app-edit-listing',
  imports: [FormsModule, RouterLink, GeoapifyGeocoderAutocompleteModule],
  templateUrl: './edit-listing.html',
  styleUrl: './edit-listing.css',
})
export class EditListing implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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

  latitude: number | null = null;
  longitude: number | null = null;

  uploadedImages: string[] = [];
  mainImageIndex = 0;
  uploading = signal(false);

  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal(false);

  dealTypes = ['For sale', 'For rent'];

  ngOnInit() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.http.get<any>(`/api/properties/${id}`).subscribe({
      next: (property) => {
        this.title = property.title;
        this.address = property.address;
        this.city = property.city;
        this.dealType = property.dealType;
        this.price = property.price;
        this.bedrooms = property.bedrooms;
        this.bathrooms = property.bathrooms;
        this.area = property.area;
        this.description = property.description || '';
        this.imageUrl = property.imageUrl || '';
        this.latitude = property.latitude;
        this.longitude = property.longitude;

        if (property.imageUrls && property.imageUrls.length > 0) {
          this.uploadedImages = property.imageUrls.split(',').filter((u: string) => u.trim());
          if (this.uploadedImages.length > 0) {
            this.mainImageIndex = 0;
          }
        } else if (property.imageUrl && property.imageUrl !== 'house.jpg') {
          this.uploadedImages = [property.imageUrl];
        }

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load listing');
      },
    });
  }

  onPlaceSelected(feature: any) {
    this.address = feature.properties.formatted || '';
    this.city = feature.properties.city || feature.properties.town || feature.properties.village || '';
    this.latitude = feature.properties.lat;
    this.longitude = feature.properties.lon;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const formData = new FormData();
    for (const file of input.files) {
      formData.append('files', file);
    }

    this.uploading.set(true);
    this.http.post<{ urls: string[] }>('/api/upload', formData).subscribe({
      next: (res) => {
        this.uploadedImages.push(...res.urls);
        this.uploading.set(false);
      },
      error: () => {
        this.uploading.set(false);
        this.error.set('Failed to upload images');
      },
    });

    input.value = '';
  }

  removeImage(index: number) {
    this.uploadedImages.splice(index, 1);
    if (this.mainImageIndex >= this.uploadedImages.length) {
      this.mainImageIndex = Math.max(0, this.uploadedImages.length - 1);
    }
  }

  setMainImage(index: number) {
    this.mainImageIndex = index;
  }

  onSubmit() {
    this.error.set('');

    if (!this.title || !this.address || !this.city || !this.price || !this.bedrooms || !this.bathrooms || !this.area) {
      this.error.set('Please fill in all required fields');
      return;
    }

    if (this.latitude === null || this.longitude === null) {
      this.error.set('Please select an address from the suggestions');
      return;
    }

    this.saving.set(true);

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const mainImage = this.uploadedImages.length > 0
      ? this.uploadedImages[this.mainImageIndex]
      : 'house.jpg';

    this.http.put(`/api/properties/${id}?userId=${this.auth.currentUser()?.id}`, {
      title: this.title,
      address: this.address,
      city: this.city,
      dealType: this.dealType,
      price: this.price,
      bedrooms: this.bedrooms,
      bathrooms: this.bathrooms,
      area: this.area,
      latitude: this.latitude,
      longitude: this.longitude,
      description: this.description,
      imageUrl: mainImage,
      imageUrls: this.uploadedImages.join(','),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/my-listings']), 1500);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Failed to update listing');
      },
    });
  }
}
