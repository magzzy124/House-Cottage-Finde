import { test, expect } from '@playwright/test';

const TEST_USER = {
  firstName: 'Fav',
  lastName: 'Tester',
  username: `favtester_${Date.now()}`,
  phone: '+1 555 111 2222',
  email: `fav_${Date.now()}@example.com`,
  password: 'FavPass123!',
};

const MOCK_PROPERTIES = [
  {
    id: 1,
    title: 'Favorite Property',
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
    description: 'Test property',
    imageUrls: '',
  },
];

const MOCK_FAVORITES = [
  {
    id: 1,
    propertyId: 1,
    createdAt: '2025-01-01T00:00:00Z',
    title: 'Favorite Property',
    address: 'Knez Mihailova 12',
    city: 'Belgrade',
    dealType: 'For sale',
    price: 150000,
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    imageUrl: 'house.jpg',
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

test.describe('Favorites', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should show empty state when no favorites', async ({ page }) => {
    page.route('**/api/favorites**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      route.fallback();
    });

    await loginUser(page);
    await page.goto('/favorites');
    await expect(page.locator('h3:has-text("No favorites yet")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Browse listings")')).toBeVisible();
  });

  test('should show favorites list', async ({ page }) => {
    page.route('**/api/favorites**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_FAVORITES),
        });
      }
      route.fallback();
    });

    await loginUser(page);
    await page.goto('/favorites');
    await expect(page.locator('h1:has-text("My Favorites")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=1 listing saved')).toBeVisible();
    await expect(page.locator('text=Favorite Property')).toBeVisible();
  });

  test('should toggle favorite from search page card', async ({ page }) => {
    page.route('**/api/properties**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PROPERTIES),
        });
      }
      route.fallback();
    });

    page.route('**/api/favorites/check**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ isFavorited: false }),
      })
    );

    page.route('**/api/favorites/1*', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ favoriteId: 1 }),
        });
      }
      route.fallback();
    });

    page.route('**/api/favorites?**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_FAVORITES),
        });
      }
      route.fallback();
    });

    await loginUser(page);
    await page.goto('/search');

    const card = page.locator('app-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });

    const heartBtn = card.locator('button[title="Favorite"]');
    await expect(heartBtn).toBeVisible();
    await heartBtn.click();
    await page.waitForTimeout(500);
  });

  test('should navigate to listing from favorites page', async ({ page }) => {
    page.route('**/api/favorites**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_FAVORITES),
        });
      }
      route.fallback();
    });

    await loginUser(page);
    await page.goto('/favorites');
    await expect(page.locator('text=Favorite Property')).toBeVisible({ timeout: 10000 });

    await page.locator('app-card').first().click();
    await expect(page).toHaveURL(/.*listing\/.*/, { timeout: 10000 });
  });

  test('should show browse more link', async ({ page }) => {
    page.route('**/api/favorites**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      route.fallback();
    });

    await loginUser(page);
    await page.goto('/favorites');
    await expect(page.locator('a:has-text("Browse more")')).toBeVisible({ timeout: 10000 });
  });
});
