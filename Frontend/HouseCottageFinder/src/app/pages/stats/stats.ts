import { Component, inject, OnInit, computed } from '@angular/core';
import { StatsService, RegionStats } from '../../services/stats-service';

@Component({
  selector: 'app-stats',
  imports: [],
  templateUrl: './stats.html',
  styleUrl: './stats.css',
})
export class Stats implements OnInit {
  statsService = inject(StatsService);

  maxListings = computed(() => {
    const regions = this.statsService.regions();
    return Math.max(...regions.map(r => r.totalListings), 1);
  });

  maxAvgPrice = computed(() => {
    const regions = this.statsService.regions();
    return Math.max(...regions.map(r => r.avgPricePerSqm), 1);
  });

  ngOnInit() {
    this.statsService.loadStats();
  }

  formatPrice(price: number): string {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}k`;
    return `$${price}`;
  }

  barWidth(value: number, max: number): string {
    return `${(value / max) * 100}%`;
  }
}
