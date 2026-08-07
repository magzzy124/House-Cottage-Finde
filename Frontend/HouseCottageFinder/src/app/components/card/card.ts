import { Component, input } from '@angular/core';
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
  WidgetType = WidgetType
  TagType = TagType

}
