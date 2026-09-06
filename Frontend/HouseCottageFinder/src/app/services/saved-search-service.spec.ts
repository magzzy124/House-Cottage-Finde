import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SavedSearchService } from './saved-search-service';
import { AuthService } from './auth-service';

describe('SavedSearchService', () => {
  let service: SavedSearchService;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const mockUser = { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SavedSearchService, AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SavedSearchService);
    auth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty searches', () => {
    expect(service.searches().length).toBe(0);
    expect(service.loading()).toBeFalsy();
  });

  describe('loadSearches', () => {
    it('should not make request when not authenticated', () => {
      service.loadSearches();
      httpMock.expectNone('/api/');
      expect(service.searches().length).toBe(0);
    });

    it('should load searches for authenticated user', () => {
      auth.setCurrentUser(mockUser);
      const mockSearches = [
        { id: 1, userId: 1, name: 'My Search', dealType: 'sale', minPrice: 50000, maxPrice: 200000, minBedrooms: 2, maxBedrooms: 4, minArea: 50, maxArea: 100, lat: 44.8, lon: 20.4, radiusKm: 10, createdAt: '2024-01-01' },
      ];

      service.loadSearches();

      const req = httpMock.expectOne('/api/saved-searches?userId=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockSearches);

      expect(service.searches().length).toBe(1);
      expect(service.searches()[0].name).toBe('My Search');
    });

    it('should set loading to true during request', () => {
      auth.setCurrentUser(mockUser);
      service.loadSearches();
      expect(service.loading()).toBeTruthy();

      const req = httpMock.expectOne('/api/saved-searches?userId=1');
      req.flush([]);
      expect(service.loading()).toBeFalsy();
    });
  });

  describe('saveSearch', () => {
    it('should POST search and return id', () => {
      auth.setCurrentUser(mockUser);
      const payload = {
        name: 'Downtown Belgrade',
        dealType: 'sale',
        minPrice: 100000,
        maxPrice: 300000,
        minBedrooms: 2,
        maxBedrooms: 4,
        minArea: 50,
        maxArea: 120,
        lat: 44.8176,
        lon: 20.4569,
        radiusKm: 5,
      };

      service.saveSearch(payload).subscribe((res) => {
        expect(res.id).toBe(1);
        expect(res.message).toBe('Search saved');
      });

      const req = httpMock.expectOne('/api/saved-searches?userId=1');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ id: 1, message: 'Search saved' });
    });
  });

  describe('deleteSearch', () => {
    it('should DELETE and remove from list', () => {
      auth.setCurrentUser(mockUser);
      // Pre-populate
      service.loadSearches();
      const listReq = httpMock.expectOne('/api/saved-searches?userId=1');
      listReq.flush([
        { id: 1, userId: 1, name: 'Search 1', dealType: 'sale', minPrice: null, maxPrice: null, minBedrooms: null, maxBedrooms: null, minArea: null, maxArea: null, lat: null, lon: null, radiusKm: null, createdAt: '' },
        { id: 2, userId: 1, name: 'Search 2', dealType: 'rent', minPrice: null, maxPrice: null, minBedrooms: null, maxBedrooms: null, minArea: null, maxArea: null, lat: null, lon: null, radiusKm: null, createdAt: '' },
      ]);

      service.deleteSearch(1);

      const req = httpMock.expectOne('/api/saved-searches/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      expect(service.searches().length).toBe(1);
      expect(service.searches()[0].id).toBe(2);
    });
  });
});
