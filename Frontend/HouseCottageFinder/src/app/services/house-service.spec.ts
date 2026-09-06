import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HouseService } from './house-service';

describe('HouseService', () => {
  let service: HouseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [HouseService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HouseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty cards and no focused property', () => {
    expect(service.cards().length).toBe(0);
    expect(service.focusedPropertyId()).toBeNull();
  });

  describe('setFilters', () => {
    it('should update filters and trigger fetch', () => {
      service.setFilters({ dealType: 'sale' });

      vi.advanceTimersByTime(200);

      const req = httpMock.expectOne((r) => r.url === '/api/properties');
      expect(req.request.params.get('dealType')).toBe('sale');
      req.flush([]);
    });

    it('should include non-default params', () => {
      service.setFilters({
        minPrice: 50000,
        maxPrice: 200000,
        minBedrooms: 2,
        maxBedrooms: 4,
        minArea: 50,
        maxArea: 150,
      });

      vi.advanceTimersByTime(200);

      const req = httpMock.expectOne((r) => r.url === '/api/properties');
      expect(req.request.params.get('minPrice')).toBe('50000');
      expect(req.request.params.get('maxPrice')).toBe('200000');
      expect(req.request.params.get('minBedrooms')).toBe('2');
      expect(req.request.params.get('maxBedrooms')).toBe('4');
      expect(req.request.params.get('minArea')).toBe('50');
      expect(req.request.params.get('maxArea')).toBe('150');
      req.flush([]);
    });

    it('should omit minPrice when null or 0', () => {
      service.setFilters({ minPrice: null });
      vi.advanceTimersByTime(200);

      const req = httpMock.expectOne((r) => r.url === '/api/properties');
      expect(req.request.params.has('minPrice')).toBeFalsy();
      req.flush([]);
    });

    it('should omit maxPrice when null or >= 1000000', () => {
      service.setFilters({ maxPrice: 1000000 });
      vi.advanceTimersByTime(200);

      const req = httpMock.expectOne((r) => r.url === '/api/properties');
      expect(req.request.params.has('maxPrice')).toBeFalsy();
      req.flush([]);
    });

    it('should omit dealType when Any', () => {
      service.setFilters({ dealType: 'Any' });
      vi.advanceTimersByTime(200);

      const req = httpMock.expectOne((r) => r.url === '/api/properties');
      expect(req.request.params.has('dealType')).toBeFalsy();
      req.flush([]);
    });

    it('should debounce multiple rapid filter changes', () => {
      service.setFilters({ dealType: 'sale' });
      service.setFilters({ minPrice: 100000 });
      service.setFilters({ maxPrice: 500000 });

      vi.advanceTimersByTime(200);

      const req = httpMock.expectOne((r) => r.url === '/api/properties');
      expect(req.request.params.get('dealType')).toBe('sale');
      expect(req.request.params.get('minPrice')).toBe('100000');
      expect(req.request.params.get('maxPrice')).toBe('500000');
      req.flush([]);
    });
  });

  describe('focusProperty', () => {
    it('should set focused property id', () => {
      service.focusProperty(42);
      expect(service.focusedPropertyId()).toBe(42);
    });

    it('should reset then set focused property id', () => {
      service.focusProperty(10);
      service.focusProperty(20);
      expect(service.focusedPropertyId()).toBe(20);
    });
  });

  describe('getProperty', () => {
    it('should GET single property by id', () => {
      service.getProperty(5).subscribe((property) => {
        expect(property.id).toBe(5);
        expect(property.title).toBe('Test House');
      });

      const req = httpMock.expectOne('/api/properties/5');
      expect(req.request.method).toBe('GET');
      req.flush({ id: 5, title: 'Test House' });
    });
  });

  describe('getPriceHistory', () => {
    it('should GET price history for a property', () => {
      service.getPriceHistory(5).subscribe((history) => {
        expect(history.length).toBe(2);
        expect(history[0].price).toBe(100000);
      });

      const req = httpMock.expectOne('/api/properties/5/price-history');
      expect(req.request.method).toBe('GET');
      req.flush([
        { price: 100000, date: '2024-01-01' },
        { price: 120000, date: '2024-06-01' },
      ]);
    });
  });

  describe('cards signal', () => {
    it('should update cards when fetch completes', () => {
      service.setFilters({ dealType: 'rent' });
      vi.advanceTimersByTime(200);

      const req = httpMock.expectOne((r) => r.url === '/api/properties');
      req.flush([{ id: 1, title: 'Rental 1' }, { id: 2, title: 'Rental 2' }]);

      expect(service.cards().length).toBe(2);
    });
  });
});
