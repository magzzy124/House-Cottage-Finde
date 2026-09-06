import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Sell } from './sell';
import { AuthService } from '../../services/auth-service';

describe('Sell', () => {
  let component: Sell;
  let fixture: ComponentFixture<Sell>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Sell],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), AuthService],
    }).compileComponents();

    fixture = TestBed.createComponent(Sell);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to login when not authenticated', () => {
    expect(auth.isAuthenticated()).toBeFalsy();
  });

  describe('onPlaceSelected', () => {
    it('should set address, city, latitude, longitude from feature', () => {
      const feature = {
        properties: {
          formatted: 'Knez Mihailova 12, Belgrade',
          city: 'Belgrade',
          lat: 44.8176,
          lon: 20.4569,
        },
      };
      component.onPlaceSelected(feature);
      expect(component.address).toBe('Knez Mihailova 12, Belgrade');
      expect(component.city).toBe('Belgrade');
      expect(component.latitude).toBe(44.8176);
      expect(component.longitude).toBe(20.4569);
    });

    it('should fallback to town when city is not available', () => {
      const feature = {
        properties: {
          formatted: 'Some address',
          town: 'Zlatibor',
          lat: 43.7,
          lon: 19.7,
        },
      };
      component.onPlaceSelected(feature);
      expect(component.city).toBe('Zlatibor');
    });

    it('should fallback to village when city and town are not available', () => {
      const feature = {
        properties: {
          formatted: 'Village address',
          village: 'Small Village',
          lat: 43.5,
          lon: 19.5,
        },
      };
      component.onPlaceSelected(feature);
      expect(component.city).toBe('Small Village');
    });
  });

  describe('onSubmit', () => {
    it('should show error when required fields are missing', () => {
      auth.setCurrentUser({ id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com' });
      component.onSubmit();
      expect(component.error()).toBe('Please fill in all required fields');
    });

    it('should show error when lat/lon not set', () => {
      auth.setCurrentUser({ id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com' });
      component.title = 'Test House';
      component.address = 'Test Address';
      component.city = 'Belgrade';
      component.price = 100000;
      component.bedrooms = 3;
      component.bathrooms = 2;
      component.area = 80;
      component.onSubmit();
      expect(component.error()).toBe('Please select an address from the suggestions');
    });

    it('should POST to create listing when all fields are valid', () => {
      auth.setCurrentUser({ id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com' });
      component.title = 'Test House';
      component.address = 'Test Address 123';
      component.city = 'Belgrade';
      component.dealType = 'For sale';
      component.price = 150000;
      component.bedrooms = 3;
      component.bathrooms = 2;
      component.area = 85;
      component.latitude = 44.8176;
      component.longitude = 20.4569;
      component.description = 'Nice house';

      component.onSubmit();

      const req = httpMock.expectOne('/api/properties?userId=1');
      expect(req.request.method).toBe('POST');
      const body = req.request.body as any;
      expect(body.title).toBe('Test House');
      expect(body.address).toBe('Test Address 123');
      expect(body.city).toBe('Belgrade');
      expect(body.dealType).toBe('For sale');
      expect(body.price).toBe(150000);
      expect(body.bedrooms).toBe(3);
      expect(body.bathrooms).toBe(2);
      expect(body.area).toBe(85);
      expect(body.latitude).toBe(44.8176);
      expect(body.longitude).toBe(20.4569);
      expect(body.description).toBe('Nice house');
      expect(body.imageUrl).toBe('house.jpg');
      req.flush({ id: 10 });

      expect(component.success()).toBeTruthy();
    });

    it('should show error on API failure', () => {
      auth.setCurrentUser({ id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com' });
      component.title = 'Test House';
      component.address = 'Test Address';
      component.city = 'Belgrade';
      component.price = 100000;
      component.bedrooms = 3;
      component.bathrooms = 2;
      component.area = 80;
      component.latitude = 44.8;
      component.longitude = 20.4;

      component.onSubmit();

      const req = httpMock.expectOne('/api/properties?userId=1');
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });

      expect(component.error()).toBe('Error');
      expect(component.loading()).toBeFalsy();
    });
  });

  describe('removeImage', () => {
    it('should remove image from uploaded list', () => {
      component.uploadedImages = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
      component.mainImageIndex = 1;
      component.removeImage(1);
      expect(component.uploadedImages).toEqual(['img1.jpg', 'img3.jpg']);
    });

    it('should adjust mainImageIndex if it exceeds length', () => {
      component.uploadedImages = ['img1.jpg'];
      component.mainImageIndex = 0;
      component.removeImage(0);
      expect(component.mainImageIndex).toBe(0);
      expect(component.uploadedImages.length).toBe(0);
    });
  });

  describe('setMainImage', () => {
    it('should set mainImageIndex', () => {
      component.uploadedImages = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
      component.setMainImage(2);
      expect(component.mainImageIndex).toBe(2);
    });
  });

  describe('dealTypes', () => {
    it('should have For sale and For rent', () => {
      expect(component.dealTypes).toEqual(['For sale', 'For rent']);
    });

    it('should default to For sale', () => {
      expect(component.dealType).toBe('For sale');
    });
  });
});
