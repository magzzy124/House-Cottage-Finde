import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Register } from './register';
import { AuthService } from '../../services/auth-service';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), AuthService],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty fields', () => {
    expect(component.firstName).toBe('');
    expect(component.lastName).toBe('');
    expect(component.username).toBe('');
    expect(component.phone).toBe('');
    expect(component.email).toBe('');
    expect(component.password).toBe('');
    expect(component.confirmPassword).toBe('');
  });

  it('should start with no error and no mismatch', () => {
    expect(component.error).toBe('');
    expect(component.mismatch).toBeFalsy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalsy();
    component.togglePassword();
    expect(component.showPassword).toBeTruthy();
  });

  describe('onPasswordChange', () => {
    it('should set mismatch when confirm does not match password', () => {
      component.password = 'Password123!';
      component.confirmPassword = 'Different';
      component.onPasswordChange();
      expect(component.mismatch).toBeTruthy();
    });

    it('should clear mismatch when confirm matches password', () => {
      component.password = 'Password123!';
      component.confirmPassword = 'Password123!';
      component.onPasswordChange();
      expect(component.mismatch).toBeFalsy();
    });

    it('should not set mismatch when confirm is empty', () => {
      component.password = 'Password123!';
      component.confirmPassword = '';
      component.onPasswordChange();
      expect(component.mismatch).toBeFalsy();
    });
  });

  describe('onRegister', () => {
    it('should set mismatch and return early if passwords do not match', () => {
      component.password = 'Password123!';
      component.confirmPassword = 'Different';

      component.onRegister();

      expect(component.mismatch).toBeTruthy();
      httpMock.expectNone('/api/');
    });

    it('should call auth.register and navigate to login on success', () => {
      component.firstName = 'John';
      component.lastName = 'Doe';
      component.username = 'johndoe';
      component.phone = '+1 555 000 0000';
      component.email = 'john@example.com';
      component.password = 'Password123!';
      component.confirmPassword = 'Password123!';

      component.onRegister();

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        phone: '+1 555 000 0000',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      req.flush({ message: 'User registered', userId: 1 });

      expect(component.loading).toBeFalsy();
    });

    it('should show 409 error for duplicate email/username', () => {
      component.firstName = 'John';
      component.lastName = 'Doe';
      component.username = 'johndoe';
      component.email = 'john@example.com';
      component.password = 'Password123!';
      component.confirmPassword = 'Password123!';

      component.onRegister();

      const req = httpMock.expectOne('/api/auth/register');
      req.flush({ message: 'Conflict' }, { status: 409, statusText: 'Conflict' });

      expect(component.error).toBe('Email or username is already in use');
      expect(component.loading).toBeFalsy();
    });

    it('should show 400 error for bad form', () => {
      component.firstName = '';
      component.password = 'Password123!';
      component.confirmPassword = 'Password123!';

      component.onRegister();

      const req = httpMock.expectOne('/api/auth/register');
      req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });

      expect(component.error).toBe('Please make sure the form is filled correctly');
    });

    it('should show generic error for server failures', () => {
      component.firstName = 'John';
      component.password = 'Password123!';
      component.confirmPassword = 'Password123!';

      component.onRegister();

      const req = httpMock.expectOne('/api/auth/register');
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });

      expect(component.error).toBe('Could not reach the server. Please try again.');
    });

    it('should clear error on new attempt', () => {
      component.error = 'Old error';
      component.password = 'Password123!';
      component.confirmPassword = 'Password123!';

      component.onRegister();

      expect(component.error).toBe('');

      const req = httpMock.expectOne('/api/auth/register');
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
    });
  });
});
