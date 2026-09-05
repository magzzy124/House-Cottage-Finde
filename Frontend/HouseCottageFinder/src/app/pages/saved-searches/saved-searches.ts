import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SavedSearchService } from '../../services/saved-search-service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-saved-searches',
  imports: [RouterLink, DatePipe],
  templateUrl: './saved-searches.html',
  styleUrl: './saved-searches.css',
})
export class SavedSearches implements OnInit {
  savedSearchService = inject(SavedSearchService);
  authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.savedSearchService.loadSearches();
  }

  deleteSearch(id: number) {
    this.savedSearchService.deleteSearch(id);
  }

  formatCriteria(search: any): string {
    const parts: string[] = [];
    if (search.dealType && search.dealType !== 'Any') parts.push(search.dealType);
    if (search.minPrice || search.maxPrice) {
      const min = search.minPrice ? `$${(search.minPrice / 1000).toFixed(0)}k` : '$0';
      const max = search.maxPrice ? `$${(search.maxPrice / 1000).toFixed(0)}k` : '∞';
      parts.push(`${min} - ${max}`);
    }
    if (search.minBedrooms || search.maxBedrooms) {
      parts.push(`${search.minBedrooms ?? 'Any'} - ${search.maxBedrooms ?? 'Any'} beds`);
    }
    if (search.minArea || search.maxArea) {
      parts.push(`${search.minArea ?? 'Any'} - ${search.maxArea ?? 'Any'} m²`);
    }
    if (search.radiusKm) parts.push(`${search.radiusKm}km radius`);
    return parts.length > 0 ? parts.join(' · ') : 'No filters';
  }
}
