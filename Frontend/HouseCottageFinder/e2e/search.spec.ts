import { test, expect } from '@playwright/test';

const TEST_USER = {
  firstName: 'Search',
  lastName: 'Tester',
  username: `searchtester_${Date.now()}`,
  phone: '+1 555 777 8888',
  email: `search_${Date.now()}@example.com`,
  password: 'SearchPass123!',
};

const MOCK_PROPERTIES = [
  {
    id: 1,
    title: 'Modern Apartment',
    address: 'Knez Mihailova 12',
    city: 'Belgrade',
    dealType: 'For sale',
    price: 150000,
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    imageUrl: 'house.jpg',
    latitude: 44.8176,
    longitude: 20.4569,
    description: 'Beautiful apartment in city center',
    imageUrls: '',
  },
  {
    id: 2,
    title: 'Cozy Cottage',
    address: 'Balkanska 5',
    city: 'Belgrade',
    dealType: 'For rent',
    price: 800,
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    imageUrl: 'house.jpg',
    latitude: 44.8048,
    longitude: 20.4781,
    description: 'Spacious cottage with garden',
    imageUrls: '',
  },
  {
    id: 3,
    title: 'Luxury Villa',
    address: 'Dedinje 1',
    city: 'Belgrade',
    dealType: 'For sale',
    price: 500000,
    bedrooms: 5,
    bathrooms: 4,
    area: 350,
    imageUrl: 'house.jpg',
    latitude: 44.765,
    longitude: 20.45,
    description: 'Luxury villa with pool',
    imageUrls: '',
  },
];

async function registerUser(page: import('@playwright/test').Page) {
  await page.goto('/register');
  await page.fill('#firstName', TEST_USER.firstName);
  await page.fill('#lastName', TEST_USER.lastName);
  await page.fill('#username', TEST_USER.username);
  await page.fill('#phone', TEST_USER.phone);
  await page.fill('#email', TEST_USER.email);
  await page.fill('#password', TEST_USER.password);
  await page.fill('#confirmPassword', TEST_USER.password);
  await page.click('button:has-text("Create account")');
  await page.waitForURL('**/login**', { timeout: 10000 });
}

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('#email', TEST_USER.email);
  await page.fill('#password', TEST_USER.password);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('**/search**', { timeout: 10000 });
}

function mockProperties(page: import('@playwright/test').Page, properties = MOCK_PROPERTIES) {
  return page.route('**/api/properties**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(properties),
      });
    }
    route.fallback();
  });
}

test.describe('Search and filters', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('should load search page with listings', async ({ page }) => {
    await mockProperties(page);
    await page.goto('/search');
    await expect(page.locator('h2:has-text("listings found")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('app-card').first()).toBeVisible();
  });

  test('should show filter controls', async ({ page }) => {
    await mockProperties(page);
    await page.goto('/search');
    await expect(page.locator('geoapify-geocoder-autocomplete')).toBeVisible();
    await expect(page.locator('text=Radius:')).toBeVisible();
    await expect(page.locator('text=Deal type:')).toBeVisible();
    await expect(page.locator('text=Price:')).toBeVisible();
  });

  test('should filter by deal type', async ({ page }) => {
    await mockProperties(page);
    await page.goto('/search');

    await page.click('text=Deal type:');
    await page.click('text=For rent');

    await expect(page.locator('text=Deal type: For rent')).toBeVisible();
  });

  test('should show listing count', async ({ page }) => {
    await mockProperties(page);
    await page.goto('/search');
    await expect(page.locator('text=3 listings found')).toBeVisible({ timeout: 10000 });
  });

  test('should show empty state when no results', async ({ page }) => {
    await mockProperties(page, []);
    await page.goto('/search');
    await expect(page.locator('h3:has-text("No listings found")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Reset filters")')).toBeVisible();
  });

  test('should click on card and navigate to listing detail', async ({ page }) => {
    await mockProperties(page);
    await page.goto('/search');
    await expect(page.locator('app-card').first()).toBeVisible({ timeout: 10000 });

    await page.locator('app-card').first().click();
    await expect(page).toHaveURL(/.*listing\/.*/, { timeout: 10000 });
  });

  test('should show save search button when logged in', async ({ page }) => {
    await mockProperties(page);
    await loginUser(page);
    await expect(page.locator('button:has-text("Save search")')).toBeVisible();
  });

  test('should open save search modal', async ({ page }) => {
    await mockProperties(page);
    await loginUser(page);

    await page.click('button:has-text("Save search")');
    await expect(page.locator('h3:has-text("Save this search")')).toBeVisible();
    await expect(page.locator('#search-name')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should show error when saving search without name', async ({ page }) => {
    await mockProperties(page);
    await page.route('**/api/saved-searches**', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 1 }),
        });
      }
      route.fallback();
    });

    await loginUser(page);
    await page.click('button:has-text("Save search")');
    await page.click('button:has-text("Save"):not(:has-text("search"))');
    await expect(page.locator('text=Please enter a name for this search')).toBeVisible();
  });

  test('should close save search modal on cancel', async ({ page }) => {
    await mockProperties(page);
    await loginUser(page);

    await page.click('button:has-text("Save search")');
    await expect(page.locator('h3:has-text("Save this search")')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h3:has-text("Save this search")')).not.toBeVisible();
  });
});
