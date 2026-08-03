import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sell } from './sell';

describe('Sell', () => {
  let component: Sell;
  let fixture: ComponentFixture<Sell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
