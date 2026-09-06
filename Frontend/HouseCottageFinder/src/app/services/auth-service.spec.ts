import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth-service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john@example.com',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no user when localStorage is empty', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalsy();
  });

  it('should load user from localStorage on init', () => {
    localStorage.setItem('hcf_user', JSON.stringify(mockUser));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    const svc = TestBed.inject(AuthService);
    expect(svc.currentUser()).toEqual(mockUser);
    expect(svc.isAuthenticated()).toBeTruthy();
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorage.setItem('hcf_user', 'not-json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    const svc = TestBed.inject(AuthService);
    expect(svc.currentUser()).toBeNull();
  });

  describe('login', () => {
    it('should POST to /api/auth/login and return user', () => {
      service.login('john@example.com', 'password123').subscribe((user) => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'john@example.com', password: 'password123' });
      req.flush(mockUser);
    });
  });

  describe('register', () => {
    it('should POST to /api/auth/register and return success', () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        phone: '+1 555 000 0000',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      service.register(payload).subscribe((res) => {
        expect(res.message).toBe('User registered');
        expect(res.userId).toBe(1);
      });

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ message: 'User registered', userId: 1 });
    });
  });

  describe('setCurrentUser', () => {
    it('should save user to localStorage and update signal', () => {
      service.setCurrentUser(mockUser);
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTruthy();
      expect(localStorage.getItem('hcf_user')).toBe(JSON.stringify(mockUser));
    });
  });

  describe('logout', () => {
    it('should remove user from localStorage and set signal to null', () => {
      service.setCurrentUser(mockUser);
      expect(service.isAuthenticated()).toBeTruthy();

      service.logout();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBeFalsy();
      expect(localStorage.getItem('hcf_user')).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should GET profile with userId query param', () => {
      service.setCurrentUser(mockUser);

      service.getProfile().subscribe((profile) => {
        expect(profile.id).toBe(1);
        expect(profile.firstName).toBe('John');
      });

      const req = httpMock.expectOne(`/api/auth/profile?userId=${mockUser.id}`);
      expect(req.request.method).toBe('GET');
      req.flush({ ...mockUser, phone: '+1 555', createdAt: '2024-01-01', favoritesCount: 5 });
    });
  });

  describe('updateProfile', () => {
    it('should PUT profile with userId query param', () => {
      service.setCurrentUser(mockUser);
      const updates = { firstName: 'Jane', phone: '+1 999' };

      service.updateProfile(updates).subscribe((res) => {
        expect(res.firstName).toBe('Jane');
        expect(res.message).toBe('Profile updated');
      });

      const req = httpMock.expectOne(`/api/auth/profile?userId=${mockUser.id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({ ...mockUser, firstName: 'Jane', message: 'Profile updated' });
    });
  });
});
