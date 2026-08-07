import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconTag } from './icon-tag';

describe('IconTag', () => {
  let component: IconTag;
  let fixture: ComponentFixture<IconTag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconTag]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconTag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
