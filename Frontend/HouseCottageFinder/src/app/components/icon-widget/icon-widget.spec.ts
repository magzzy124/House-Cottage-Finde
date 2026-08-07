import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconWidget } from './icon-widget';

describe('IconWidget', () => {
  let component: IconWidget;
  let fixture: ComponentFixture<IconWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
