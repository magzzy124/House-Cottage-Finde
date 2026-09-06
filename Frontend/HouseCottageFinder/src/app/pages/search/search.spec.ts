import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Search } from './search';
import { HouseService } from '../../services/house-service';
import { SelectedLocation } from '../../services/selected-location';
import { AuthService } from '../../services/auth-service';
import { SavedSearchService } from '../../services/saved-search-service';

describe('Search', () => {
  let component: Search;
  let houseService: HouseService;
  let auth: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        HouseService,
        SelectedLocation,
        AuthService,
        SavedSearchService,
      ],
    });

    houseService = TestBed.inject(HouseService);
    auth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    component = TestBed.runInInjectionContext(() => new Search());
  });

  afterEach(() => {
    httpMock.match(() => true);
    httpMock.verify();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default deal types', () => {
    expect(component.dealTypes).toEqual(['Any', 'For rent', 'For sale']);
  });

  it('should default to Any deal type', () => {
    expect(component.selectedDealType()).toBe('Any');
  });

  it('should default to km tab', () => {
    expect(component.selectedTab()).toBe('km');
  });

  it('should default radius to 10', () => {
    expect(component.radius).toBe(10);
  });

  describe('selectDealType', () => {
    it('should update deal type signal', () => {
      component.selectDealType('For sale');
      expect(component.selectedDealType()).toBe('For sale');
    });

    it('should apply price range for rent', () => {
      component.selectDealType('For rent');
      expect(component.options.ceil).toBe(5000);
      expect(component.maxValue).toBe(5000);
    });

    it('should apply price range for sale', () => {
      component.selectDealType('For sale');
      expect(component.options.ceil).toBe(1000000);
      expect(component.maxValue).toBe(1000000);
    });
  });

  describe('selectTab', () => {
    it('should update tab signal', () => {
      component.selectTab('m');
      expect(component.selectedTab()).toBe('m');
    });
  });

  describe('formatPrice', () => {
    it('should format prices under 1000', () => {
      expect(component.formatPrice(500)).toBe('$500');
    });

    it('should format prices at 1000', () => {
      expect(component.formatPrice(1000)).toBe('$1k');
    });

    it('should format large prices', () => {
      expect(component.formatPrice(150000)).toBe('$150k');
    });

    it('should format decimal prices', () => {
      expect(component.formatPrice(1500)).toBe('$1.5k');
    });
  });

  describe('applyFilters', () => {
    it('should call houseService.setFilters with current state', () => {
      const spy = vi.spyOn(houseService, 'setFilters');
      component.applyFilters();

      expect(spy).toHaveBeenCalled();
      const callArgs = spy.mock.calls[0][0];
      expect(callArgs.dealType).toBe('Any');
      expect(callArgs.radiusKm).toBe(10);
      expect(callArgs.lat).toBeDefined();
      expect(callArgs.lon).toBeDefined();
    });

    it('should convert km to km in filters', () => {
      component.radius = 25;
      component.selectTab('km');
      const spy = vi.spyOn(houseService, 'setFilters');
      component.applyFilters();
      const callArgs = spy.mock.calls[0][0];
      expect(callArgs.radiusKm).toBe(25);
    });

    it('should convert meters to km in filters', () => {
      component.radius = 5000;
      component.selectTab('m');
      const spy = vi.spyOn(houseService, 'setFilters');
      component.applyFilters();
      const callArgs = spy.mock.calls[0][0];
      expect(callArgs.radiusKm).toBe(5);
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to defaults', () => {
      component.selectDealType('For sale');
      component.radius = 25;
      component.selectTab('m');
      component.minBedrooms = 2;
      component.maxBedrooms = 5;
      component.minArea = 50;
      component.maxArea = 150;

      component.resetFilters();

      expect(component.selectedDealType()).toBe('Any');
      expect(component.selectedTab()).toBe('km');
      expect(component.radius).toBe(10);
      expect(component.minBedrooms).toBeNull();
      expect(component.maxBedrooms).toBeNull();
      expect(component.minArea).toBeNull();
      expect(component.maxArea).toBeNull();
    });
  });

  describe('saveSearch', () => {
    it('should show error when name is empty', () => {
      component.saveSearchName = '';
      component.saveSearch();
      expect(component.saveSearchError()).toBe('Please enter a name for this search');
    });

    it('should show error when name is whitespace only', () => {
      component.saveSearchName = '   ';
      component.saveSearch();
      expect(component.saveSearchError()).toBe('Please enter a name for this search');
    });

    it('should save search with valid name', () => {
      auth.setCurrentUser({ id: 1, firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@example.com' });
      component.saveSearchName = 'My Search';

      component.saveSearch();

      const req = httpMock.expectOne('/api/saved-searches?userId=1');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 1, message: 'Saved' });

      expect(component.saveSearchSuccess()).toBeTruthy();
    });
  });
});
