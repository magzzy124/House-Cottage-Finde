import { TestBed } from '@angular/core/testing';
import { CompareService } from './compare-service';

describe('CompareService', () => {
  let service: CompareService;

  const createItem = (id: number) => ({
    id,
    title: `House ${id}`,
    address: `Address ${id}`,
    city: 'Belgrade',
    dealType: 'sale',
    price: 100000 + id * 10000,
    bedrooms: 3,
    bathrooms: 2,
    area: 80,
    imageUrl: `img${id}.jpg`,
    latitude: 44.8,
    longitude: 20.4,
    description: `Description ${id}`,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty items', () => {
    expect(service.items().length).toBe(0);
    expect(service.showBar()).toBeFalsy();
  });

  it('should return 0 for count initially', () => {
    expect(service.count).toBe(0);
  });

  it('should return maxCompare of 4', () => {
    expect(service.maxCompare).toBe(4);
  });

  describe('toggle', () => {
    it('should add an item', () => {
      service.toggle(createItem(1));
      expect(service.items().length).toBe(1);
      expect(service.items()[0].id).toBe(1);
      expect(service.showBar()).toBeTruthy();
    });

    it('should remove an existing item on second toggle', () => {
      service.toggle(createItem(1));
      service.toggle(createItem(1));
      expect(service.items().length).toBe(0);
      expect(service.showBar()).toBeFalsy();
    });

    it('should add multiple items up to max', () => {
      service.toggle(createItem(1));
      service.toggle(createItem(2));
      service.toggle(createItem(3));
      service.toggle(createItem(4));
      expect(service.items().length).toBe(4);
      expect(service.count).toBe(4);
    });

    it('should not add more than MAX_COMPARE items', () => {
      service.toggle(createItem(1));
      service.toggle(createItem(2));
      service.toggle(createItem(3));
      service.toggle(createItem(4));
      service.toggle(createItem(5));
      expect(service.items().length).toBe(4);
    });

    it('should use default imageUrl when not provided', () => {
      const item = createItem(1);
      item.imageUrl = '';
      service.toggle(item);
      expect(service.items()[0].imageUrl).toBe('house.jpg');
    });

    it('should use empty string for description when not provided', () => {
      const item = createItem(1);
      item.description = '';
      service.toggle(item);
      expect(service.items()[0].description).toBe('');
    });
  });

  describe('remove', () => {
    it('should remove an item by id', () => {
      service.toggle(createItem(1));
      service.toggle(createItem(2));
      service.remove(1);
      expect(service.items().length).toBe(1);
      expect(service.items()[0].id).toBe(2);
    });

    it('should hide bar when all items removed', () => {
      service.toggle(createItem(1));
      service.remove(1);
      expect(service.showBar()).toBeFalsy();
    });
  });

  describe('clear', () => {
    it('should remove all items and hide bar', () => {
      service.toggle(createItem(1));
      service.toggle(createItem(2));
      service.toggle(createItem(3));
      service.clear();
      expect(service.items().length).toBe(0);
      expect(service.showBar()).toBeFalsy();
    });
  });

  describe('isSelected', () => {
    it('should return true for added items', () => {
      service.toggle(createItem(1));
      expect(service.isSelected(1)).toBeTruthy();
    });

    it('should return false for non-added items', () => {
      expect(service.isSelected(99)).toBeFalsy();
    });

    it('should return false after item is removed', () => {
      service.toggle(createItem(1));
      service.toggle(createItem(1));
      expect(service.isSelected(1)).toBeFalsy();
    });
  });
});
