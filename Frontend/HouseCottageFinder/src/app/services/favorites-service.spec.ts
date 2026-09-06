import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FavoritesService } from './favorites-service';
import { AuthService } from './auth-service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const mockUser = { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com' };

  const mockFavItem = { id: 1, propertyId: 10, title: 'House 1', address: 'Addr 1', city: 'Belgrade', dealType: 'sale', price: 100000, bedrooms: 3, bathrooms: 2, area: 80, imageUrl: 'img1.jpg', createdAt: '' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [FavoritesService, AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FavoritesService);
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

  it('should start with empty favorites', () => {
    expect(service.favoriteIds().size).toBe(0);
    expect(service.favorites().length).toBe(0);
  });

  describe('loadFavorites', () => {
    it('should not make request when not authenticated', () => {
      service.loadFavorites();
      httpMock.expectNone('/api/');
      expect(service.favorites().length).toBe(0);
      expect(service.favoriteIds().size).toBe(0);
    });

    it('should load favorites for authenticated user', () => {
      auth.setCurrentUser(mockUser);
      const mockFavorites = [mockFavItem, { id: 2, propertyId: 20, title: 'House 2', address: 'Addr 2', city: 'Novi Sad', dealType: 'rent', price: 500, bedrooms: 2, bathrooms: 1, area: 50, imageUrl: 'img2.jpg', createdAt: '' }];

      service.loadFavorites();

      const req = httpMock.expectOne('/api/favorites?userId=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockFavorites);

      expect(service.favorites().length).toBe(2);
      expect(service.favoriteIds().has(10)).toBeTruthy();
      expect(service.favoriteIds().has(20)).toBeTruthy();
    });

    it('should set loading to true during request', () => {
      auth.setCurrentUser(mockUser);
      expect(service.loading()).toBeFalsy();

      service.loadFavorites();
      expect(service.loading()).toBeTruthy();

      const req = httpMock.expectOne('/api/favorites?userId=1');
      req.flush([]);
      expect(service.loading()).toBeFalsy();
    });
  });

  describe('checkFavorite', () => {
    it('should not make request when not authenticated', () => {
      service.checkFavorite(10);
      httpMock.expectNone('/api/');
    });

    it('should add propertyId to favorites when isFavorited is true', () => {
      auth.setCurrentUser(mockUser);
      service.checkFavorite(10);

      const req = httpMock.expectOne('/api/favorites/check?userId=1&propertyId=10');
      req.flush({ isFavorited: true });

      expect(service.favoriteIds().has(10)).toBeTruthy();
    });

    it('should remove propertyId from favorites when isFavorited is false', () => {
      auth.setCurrentUser(mockUser);
      service.checkFavorite(10);

      const req = httpMock.expectOne('/api/favorites/check?userId=1&propertyId=10');
      req.flush({ isFavorited: false });

      expect(service.favoriteIds().has(10)).toBeFalsy();
    });
  });

  describe('toggleFavorite', () => {
    it('should not make request when not authenticated', () => {
      service.toggleFavorite(10);
      httpMock.expectNone('/api/');
    });

    it('should POST when adding a new favorite', () => {
      auth.setCurrentUser(mockUser);
      service.toggleFavorite(10);

      const req = httpMock.expectOne('/api/favorites/10?userId=1');
      expect(req.request.method).toBe('POST');
      req.flush({ favoriteId: 1 });

      const listReq = httpMock.expectOne('/api/favorites?userId=1');
      listReq.flush([mockFavItem]);

      expect(service.favoriteIds().has(10)).toBeTruthy();
    });

    it('should DELETE when removing an existing favorite', () => {
      auth.setCurrentUser(mockUser);

      // Add favorite first
      service.toggleFavorite(10);
      const postReq = httpMock.expectOne('/api/favorites/10?userId=1');
      postReq.flush({ favoriteId: 1 });

      const listReq = httpMock.expectOne('/api/favorites?userId=1');
      listReq.flush([mockFavItem]);

      // Now remove
      service.toggleFavorite(10);
      const delReq = httpMock.expectOne('/api/favorites/10?userId=1');
      expect(delReq.request.method).toBe('DELETE');
      delReq.flush({});

      expect(service.favoriteIds().has(10)).toBeFalsy();
    });
  });

  describe('isFavorited', () => {
    it('should return false when property is not favorited', () => {
      expect(service.isFavorited(10)).toBeFalsy();
    });

    it('should return true when property is favorited', () => {
      auth.setCurrentUser(mockUser);
      service.toggleFavorite(10);
      const req = httpMock.expectOne('/api/favorites/10?userId=1');
      req.flush({ favoriteId: 1 });

      const listReq = httpMock.expectOne('/api/favorites?userId=1');
      listReq.flush([mockFavItem]);

      expect(service.isFavorited(10)).toBeTruthy();
    });
  });
});
