import { Component, computed, input, output } from '@angular/core';
import { IconWidget } from "../icon-widget/icon-widget";
import { WidgetType, TagType } from '../../models/widgetType';
import { IconTag } from "../icon-tag/icon-tag";

@Component({
  selector: 'app-card',
  imports: [IconWidget, IconTag],
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card {
  cardDetails = input<any>();
  clicked = output<number>();
  WidgetType = WidgetType
  TagType = TagType

  dealType = computed(() => this.cardDetails()?.dealType ?? 'For sale');
  dealColor = computed(() => this.dealType() === 'For sale' ? '#4a8dd0' : '#f59e0b');
  dealBg = computed(() => this.dealType() === 'For sale' ? '#e8f1fa' : '#fdf1e2');
  cardImage = computed(() => this.cardDetails()?.imageUrl || 'house.jpg');

  onClick() {
    this.clicked.emit(this.cardDetails()?.id);
  }
}