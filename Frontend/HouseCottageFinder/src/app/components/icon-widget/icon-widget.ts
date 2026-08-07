import { Component, input } from '@angular/core';
import { WidgetType } from '../../models/widgetType';

@Component({
  selector: 'app-icon-widget',
  imports: [],
  templateUrl: './icon-widget.html',
  styleUrl: './icon-widget.css',
})
export class IconWidget {
  count = input.required<number>();
  type = input.required<WidgetType>();
  WidgetType = WidgetType
}
