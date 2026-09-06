import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChatService } from './chat-service';
import { AuthService } from './auth-service';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const mockUser = { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com' };

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [ChatService, AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChatService);
    auth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.stopPolling();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty messages', () => {
    expect(service.messages().length).toBe(0);
    expect(service.sending()).toBeFalsy();
  });

  describe('loadMessages', () => {
    it('should not make request when not authenticated', () => {
      service.loadMessages(10);
      httpMock.expectNone('/api/');
    });

    it('should load messages for a property', () => {
      auth.setCurrentUser(mockUser);
      const mockMessages = [
        { id: 1, propertyId: 10, senderId: 1, senderName: 'John', content: 'Hello', sentAt: '2024-01-01' },
      ];

      service.loadMessages(10);

      const req = httpMock.expectOne('/api/chat/messages?propertyId=10&userId=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockMessages);

      expect(service.messages().length).toBe(1);
      expect(service.messages()[0].content).toBe('Hello');
    });
  });

  describe('sendMessage', () => {
    it('should not make request when not authenticated', () => {
      service.sendMessage(10, 'Hello');
      httpMock.expectNone('/api/');
    });

    it('should not send empty messages', () => {
      auth.setCurrentUser(mockUser);
      service.sendMessage(10, '   ');
      httpMock.expectNone('/api/');
    });

    it('should POST message and append to messages', () => {
      auth.setCurrentUser(mockUser);
      service.sendMessage(10, 'Hello there');

      expect(service.sending()).toBeTruthy();

      const req = httpMock.expectOne('/api/chat/messages?userId=1');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ propertyId: 10, content: 'Hello there' });

      const newMsg = { id: 2, propertyId: 10, senderId: 1, senderName: 'John', content: 'Hello there', sentAt: '2024-01-01' };
      req.flush(newMsg);

      expect(service.sending()).toBeFalsy();
      expect(service.messages().length).toBe(1);
      expect(service.messages()[0].content).toBe('Hello there');
    });

    it('should set sending to false on error', () => {
      auth.setCurrentUser(mockUser);
      service.sendMessage(10, 'Hello');

      const req = httpMock.expectOne('/api/chat/messages?userId=1');
      req.error(new ProgressEvent('error'));

      expect(service.sending()).toBeFalsy();
    });
  });

  describe('startPolling / stopPolling', () => {
    it('should load messages immediately when polling starts', () => {
      auth.setCurrentUser(mockUser);
      service.startPolling(10);

      const req = httpMock.expectOne('/api/chat/messages?propertyId=10&userId=1');
      req.flush([]);
      expect(service.messages().length).toBe(0);
    });

    it('should periodically load messages', () => {
      auth.setCurrentUser(mockUser);
      service.startPolling(10);

      const req = httpMock.expectOne('/api/chat/messages?propertyId=10&userId=1');
      req.flush([{ id: 1, propertyId: 10, senderId: 1, senderName: 'John', content: 'Hi', sentAt: '' }]);

      vi.advanceTimersByTime(5000);

      const req2 = httpMock.expectOne('/api/chat/messages?propertyId=10&userId=1');
      req2.flush([{ id: 1, propertyId: 10, senderId: 1, senderName: 'John', content: 'Hi', sentAt: '' }, { id: 2, propertyId: 10, senderId: 2, senderName: 'Jane', content: 'Hey', sentAt: '' }]);

      expect(service.messages().length).toBe(2);
    });

    it('should clear messages when polling stops', () => {
      auth.setCurrentUser(mockUser);
      service.startPolling(10);

      const req = httpMock.expectOne('/api/chat/messages?propertyId=10&userId=1');
      req.flush([{ id: 1, propertyId: 10, senderId: 1, senderName: 'John', content: 'Hi', sentAt: '' }]);

      expect(service.messages().length).toBe(1);

      service.stopPolling();
      expect(service.messages().length).toBe(0);
    });
  });
});
