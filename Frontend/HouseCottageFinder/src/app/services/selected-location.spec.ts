import { TestBed } from '@angular/core/testing';

import { SelectedLocation } from './selected-location';

describe('SelectedLocation', () => {
  let service: SelectedLocation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectedLocation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
