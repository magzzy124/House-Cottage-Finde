import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../services/auth-service';
import { FavoritesService } from '../../services/favorites-service';
import { NotificationService } from '../../services/notification-service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'search', component: class {} }]),
        AuthService,
        FavoritesService,
        NotificationService,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.match(() => true);
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty email and password', () => {
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });

  it('should start with no error or success message', () => {
    expect(component.error).toBe('');
    expect(component.success).toBe('');
  });

  it('should start with loading false', () => {
    expect(component.loading).toBeFalsy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalsy();
    component.togglePassword();
    expect(component.showPassword).toBeTruthy();
    component.togglePassword();
    expect(component.showPassword).toBeFalsy();
  });

  describe('onLogin', () => {
    it('should call auth.login and set user on success', () => {
      const mockUser = { id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com' };
      component.email = 'john@example.com';
      component.password = 'password123';

      component.onLogin();

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'john@example.com', password: 'password123' });
      req.flush(mockUser);

      const favReq = httpMock.expectOne('/api/favorites?userId=1');
      favReq.flush([]);

      const notifReq = httpMock.expectOne('/api/notifications/unread-count?userId=1');
      notifReq.flush({ count: 0 });

      expect(auth.currentUser()).toEqual(mockUser);
      expect(component.loading).toBeFalsy();
    });

    it('should show error on 401', () => {
      component.email = 'wrong@example.com';
      component.password = 'wrongpass';

      component.onLogin();

      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(component.error).toBe('Invalid email or password');
      expect(component.loading).toBeFalsy();
    });

    it('should show generic error on other failures', () => {
      component.email = 'john@example.com';
      component.password = 'password123';

      component.onLogin();

      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });

      expect(component.error).toBe('Could not reach the server. Please try again.');
      expect(component.loading).toBeFalsy();
    });

    it('should clear previous error on new login attempt', () => {
      component.error = 'Previous error';
      component.email = 'john@example.com';
      component.password = 'password123';

      component.onLogin();

      expect(component.error).toBe('');

      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: 'Bad' }, { status: 401, statusText: 'Unauthorized' });

      expect(component.error).toBe('Invalid email or password');
    });
  });
});
