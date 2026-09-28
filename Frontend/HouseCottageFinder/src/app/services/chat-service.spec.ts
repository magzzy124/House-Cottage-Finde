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

  const mockThread = {
    propertyId: 10,
    otherUserId: 2,
    otherName: 'Jane Doe',
    propertyTitle: 'House Alpha',
    propertyImage: 'house.jpg',
    lastMessage: 'Hi',
    lastMessageAt: '2024-01-01T00:00:00Z',
    unreadCount: 2,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ChatService, AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChatService);
    auth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne('/api/auth/me').error(new ProgressEvent('error'));
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty messages and threads', () => {
    expect(service.messages().length).toBe(0);
    expect(service.threads().length).toBe(0);
    expect(service.sending()).toBeFalsy();
    expect(service.unreadTotal()).toBe(0);
  });

  describe('loadMessages', () => {
    it('should not make request when not authenticated', () => {
      service.loadMessages(10, 2);
      httpMock.expectNone('/api/chat/messages');
    });

    it('should load only the conversation with the given user', () => {
      auth.setCurrentUser(mockUser);
      service.loadMessages(10, 2);

      const req = httpMock.expectOne('/api/chat/messages?propertyId=10&withUserId=2');
      expect(req.request.method).toBe('GET');
      req.flush([
        {
          id: 1,
          propertyId: 10,
          senderId: 2,
          recipientId: 1,
          senderName: 'Jane Doe',
          content: 'Hello',
          sentAt: '2024-01-01',
          isRead: false,
        },
      ]);

      expect(service.messages().length).toBe(1);
      expect(service.messages()[0].recipientId).toBe(1);
      expect(service.messages()[0].content).toBe('Hello');
    });
  });

  describe('sendMessage', () => {
    it('should not make request when not authenticated', () => {
      service.sendMessage(10, 2, 'Hello');
      httpMock.expectNone('/api/chat/messages');
    });

    it('should not send empty messages', () => {
      auth.setCurrentUser(mockUser);
      service.sendMessage(10, 2, '   ');
      httpMock.expectNone('/api/chat/messages');
    });

    it('should POST message with recipient and append to messages', () => {
      auth.setCurrentUser(mockUser);
      service.sendMessage(10, 2, 'Hello there');

      expect(service.sending()).toBeTruthy();

      const req = httpMock.expectOne('/api/chat/messages');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ propertyId: 10, recipientId: 2, content: 'Hello there' });

      const newMsg = {
        id: 2,
        propertyId: 10,
        senderId: 1,
        recipientId: 2,
        senderName: 'John Doe',
        content: 'Hello there',
        sentAt: '2024-01-01',
        isRead: false,
      };
      req.flush(newMsg);

      expect(service.sending()).toBeFalsy();
      expect(service.messages().length).toBe(1);
      expect(service.messages()[0].content).toBe('Hello there');
    });

    it('should set sending to false on error', () => {
      auth.setCurrentUser(mockUser);
      service.sendMessage(10, 2, 'Hello');

      const req = httpMock.expectOne('/api/chat/messages');
      req.error(new ProgressEvent('error'));

      expect(service.sending()).toBeFalsy();
    });
  });

  describe('threads', () => {
    it('should not make request when not authenticated', () => {
      service.loadThreads().subscribe();
      httpMock.expectNone('/api/chat/threads');
    });

    it('should load threads and compute unread total', () => {
      auth.setCurrentUser(mockUser);
      service.loadThreads().subscribe();

      const req = httpMock.expectOne('/api/chat/threads');
      expect(req.request.method).toBe('GET');
      req.flush([mockThread, { ...mockThread, propertyId: 11, otherUserId: 3, unreadCount: 1 }]);

      expect(service.threads().length).toBe(2);
      expect(service.unreadTotal()).toBe(3);
    });

    it('should filter threads by property', () => {
      auth.setCurrentUser(mockUser);
      service.loadThreads(10).subscribe();

      const req = httpMock.expectOne('/api/chat/threads?propertyId=10');
      req.flush([mockThread]);

      expect(service.threads().length).toBe(1);
      expect(service.threads()[0].propertyId).toBe(10);
    });

    it('ensureThreads should fetch only once', () => {
      auth.setCurrentUser(mockUser);
      service.ensureThreads();
      httpMock.expectOne('/api/chat/threads').flush([]);

      service.ensureThreads();
      httpMock.expectNone('/api/chat/threads');
    });

    it('refreshThreads should be a no-op before the first load', () => {
      auth.setCurrentUser(mockUser);
      service.refreshThreads();
      httpMock.expectNone('/api/chat/threads');
    });

    it('clearThreads should reset threads and unread total', () => {
      auth.setCurrentUser(mockUser);
      service.loadThreads().subscribe();
      httpMock.expectOne('/api/chat/threads').flush([mockThread]);

      expect(service.unreadTotal()).toBe(2);

      service.clearThreads();
      expect(service.threads().length).toBe(0);
      expect(service.unreadTotal()).toBe(0);
    });
  });
});
