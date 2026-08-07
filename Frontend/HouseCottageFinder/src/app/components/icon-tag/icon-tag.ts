import { Component, computed, input } from '@angular/core';
import { TagType } from '../../models/widgetType';

@Component({
  selector: 'app-icon-tag',
  imports: [],
  templateUrl: './icon-tag.html',
  styleUrl: './icon-tag.css',
})
export class IconTag {
  TagType = TagType
  type = input<TagType>();
  color = computed(() => {
    switch (this.type()) {
      case (TagType.new):
        return "#48cf8f";
      case (TagType.forSale):
        return "#4a8dd0";
    }
    return "";
  })
}
