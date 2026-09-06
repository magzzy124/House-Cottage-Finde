import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService } from './notification-service';
import { AuthService } from './auth-service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const mockUser = { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com' };

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [NotificationService, AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationService);
    auth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.ngOnDestroy();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty state', () => {
    expect(service.notifications().length).toBe(0);
    expect(service.unreadCount()).toBe(0);
    expect(service.loading()).toBeFalsy();
  });

  describe('loadNotifications', () => {
    it('should not make request when not authenticated', () => {
      service.loadNotifications();
      httpMock.expectNone('/api/');
      expect(service.notifications().length).toBe(0);
    });

    it('should load notifications for authenticated user', () => {
      auth.setCurrentUser(mockUser);
      const mockNotifications = [
        { id: 1, propertyId: 10, title: 'New listing', message: 'Matches your search', isRead: false, createdAt: '2024-01-01', propertyTitle: 'House 1' },
      ];

      service.loadNotifications();

      const req = httpMock.expectOne('/api/notifications?userId=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockNotifications);

      expect(service.notifications().length).toBe(1);
      expect(service.notifications()[0].title).toBe('New listing');
    });

    it('should set loading to true during request', () => {
      auth.setCurrentUser(mockUser);
      service.loadNotifications();
      expect(service.loading()).toBeTruthy();

      const req = httpMock.expectOne('/api/notifications?userId=1');
      req.flush([]);
      expect(service.loading()).toBeFalsy();
    });
  });

  describe('loadUnreadCount', () => {
    it('should not make request when not authenticated', () => {
      service.loadUnreadCount();
      httpMock.expectNone('/api/');
    });

    it('should load unread count', () => {
      auth.setCurrentUser(mockUser);
      service.loadUnreadCount();

      const req = httpMock.expectOne('/api/notifications/unread-count?userId=1');
      expect(req.request.method).toBe('GET');
      req.flush({ count: 5 });

      expect(service.unreadCount()).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should PUT to mark notification as read and update state', () => {
      auth.setCurrentUser(mockUser);
      // Pre-populate notifications
      service.loadNotifications();
      const listReq = httpMock.expectOne('/api/notifications?userId=1');
      listReq.flush([
        { id: 1, propertyId: 10, title: 'Notif 1', message: 'msg', isRead: false, createdAt: '', propertyTitle: null },
        { id: 2, propertyId: 20, title: 'Notif 2', message: 'msg', isRead: false, createdAt: '', propertyTitle: null },
      ]);

      service.markAsRead(1);

      const req = httpMock.expectOne('/api/notifications/1/read');
      expect(req.request.method).toBe('PUT');
      req.flush({});

      const notif = service.notifications().find((n) => n.id === 1);
      expect(notif?.isRead).toBeTruthy();
      const notif2 = service.notifications().find((n) => n.id === 2);
      expect(notif2?.isRead).toBeFalsy();
    });
  });

  describe('markAllAsRead', () => {
    it('should PUT to mark all as read and set unreadCount to 0', () => {
      auth.setCurrentUser(mockUser);
      service.loadNotifications();
      const listReq = httpMock.expectOne('/api/notifications?userId=1');
      listReq.flush([
        { id: 1, propertyId: 10, title: 'Notif 1', message: 'msg', isRead: false, createdAt: '', propertyTitle: null },
      ]);

      service.markAllAsRead();

      const req = httpMock.expectOne('/api/notifications/read-all?userId=1');
      expect(req.request.method).toBe('PUT');
      req.flush({});

      expect(service.unreadCount()).toBe(0);
      expect(service.notifications().every((n) => n.isRead)).toBeTruthy();
    });

    it('should not make request when not authenticated', () => {
      service.markAllAsRead();
      httpMock.expectNone('/api/');
    });
  });

  describe('startPolling', () => {
    it('should load unread count immediately and periodically', () => {
      auth.setCurrentUser(mockUser);
      service.startPolling();

      const req = httpMock.expectOne('/api/notifications/unread-count?userId=1');
      req.flush({ count: 3 });
      expect(service.unreadCount()).toBe(3);

      vi.advanceTimersByTime(30000);

      const req2 = httpMock.expectOne('/api/notifications/unread-count?userId=1');
      req2.flush({ count: 5 });

      expect(service.unreadCount()).toBe(5);
    });
  });
});
