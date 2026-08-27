import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CompareService, CompareItem } from '../../services/compare-service';

@Component({
  selector: 'app-compare',
  imports: [RouterLink],
  templateUrl: './compare.html',
  styleUrl: './compare.css',
})
export class Compare {
  compareService = inject(CompareService);
  private router = inject(Router);

  get items(): CompareItem[] {
    return this.compareService.items();
  }

  formatPrice(price: number): string {
    return price.toLocaleString('en-US');
  }

  pricePerSqm(item: CompareItem): number {
    return item.area > 0 ? Math.round(item.price / item.area) : 0;
  }

  removeItem(id: number) {
    this.compareService.remove(id);
    if (this.items.length === 0) {
      this.router.navigate(['/search']);
    }
  }

  clearAll() {
    this.compareService.clear();
    this.router.navigate(['/search']);
  }

  viewListing(id: number) {
    this.router.navigate(['/listing', id]);
  }
}
