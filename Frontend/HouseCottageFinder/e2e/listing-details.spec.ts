import { test, expect } from '@playwright/test';

const TEST_USER = {
  firstName: 'Detail',
  lastName: 'Tester',
  username: `detailtester_${Date.now()}`,
  phone: '+1 555 999 0000',
  email: `detail_${Date.now()}@example.com`,
  password: 'DetailPass123!',
};

const PROPERTY_ID = 42;

const MOCK_PROPERTY = {
  id: PROPERTY_ID,
  title: 'Test Property',
  address: 'Knez Mihailova 12',
  city: 'Belgrade',
  dealType: 'For sale',
  price: 200000,
  bedrooms: 3,
  bathrooms: 2,
  area: 100,
  imageUrl: 'house.jpg',
  imageUrls: 'house.jpg?v=1,house.jpg?v=2,house.jpg?v=3,house.jpg?v=4,house.jpg?v=5,house.jpg?v=6,house.jpg?v=7,house.jpg?v=8',
  latitude: 44.8176,
  longitude: 20.4569,
  description: 'A beautiful test property in the center of Belgrade.',
};

const MOCK_PRICE_HISTORY = [
  { price: 180000, date: '2024-01-01' },
  { price: 190000, date: '2024-06-01' },
  { price: 200000, date: '2025-01-01' },
];

function mockProperty(page: import('@playwright/test').Page) {
  page.route(`**/api/properties/${PROPERTY_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PROPERTY),
    })
  );
  page.route(`**/api/properties/${PROPERTY_ID}/price-history`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PRICE_HISTORY),
    })
  );
}

function mockFavoriteCheck(page: import('@playwright/test').Page, isFavorited = false) {
  page.route('**/api/favorites/check**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ isFavorited }),
    })
  );
}

function mockToggleFavorite(page: import('@playwright/test').Page) {
  page.route('**/api/favorites/*', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ favoriteId: 1 }),
      });
    }
    if (route.request().method() === 'DELETE') {
      return route.fulfill({ status: 200, body: JSON.stringify({}) });
    }
    route.fallback();
  });
}

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

test.describe('Listing details', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('should load listing with all details', async ({ page }) => {
    mockProperty(page);
    mockFavoriteCheck(page);

    await loginUser(page);
    await page.goto(`/listing/${PROPERTY_ID}`);

    await expect(page.locator('h1:has-text("$ 200000")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Test Property")')).toBeVisible();
    await expect(page.locator('text=Knez Mihailova 12, Belgrade').first()).toBeVisible();
    await expect(page.locator('text=For sale')).toBeVisible();
  });

  test('should show description', async ({ page }) => {
    mockProperty(page);
    mockFavoriteCheck(page);

    await loginUser(page);
    await page.goto(`/listing/${PROPERTY_ID}`);

    await expect(page.locator('text=A beautiful test property')).toBeVisible({ timeout: 10000 });
  });

  test('should show back to search link', async ({ page }) => {
    mockProperty(page);
    mockFavoriteCheck(page);

    await loginUser(page);
    await page.goto(`/listing/${PROPERTY_ID}`);

    await expect(page.locator('a:has-text("Back to search")')).toBeVisible({ timeout: 10000 });
  });

  test('should show favorite button when logged in', async ({ page }) => {
    mockProperty(page);
    mockFavoriteCheck(page);

    await loginUser(page);
    await page.goto(`/listing/${PROPERTY_ID}`);

    await expect(page.locator('button.w-11.h-11.rounded-full').first()).toBeVisible({ timeout: 10000 });
  });

  test('should toggle favorite', async ({ page }) => {
    mockProperty(page);
    mockFavoriteCheck(page, false);
    mockToggleFavorite(page);

    await loginUser(page);
    await page.goto(`/listing/${PROPERTY_ID}`);

    const favBtn = page.locator('button.w-11.h-11.rounded-full').first();
    await expect(favBtn).toBeVisible({ timeout: 10000 });
    await favBtn.click();
    await page.waitForTimeout(500);
  });

  test('should show chat link when logged in', async ({ page }) => {
    mockProperty(page);
    mockFavoriteCheck(page);

    await loginUser(page);
    await page.goto(`/listing/${PROPERTY_ID}`);

    await expect(page.locator('a:has-text("Pošaljite poruku")')).toBeVisible({ timeout: 10000 });
  });

  test('should show chat link navigates to chat page', async ({ page }) => {
    mockProperty(page);
    mockFavoriteCheck(page);

    await loginUser(page);
    await page.goto(`/listing/${PROPERTY_ID}`);

    const chatLink = page.locator('a:has-text("Pošaljite poruku")');
    await expect(chatLink).toBeVisible({ timeout: 10000 });
    await chatLink.click();
    await expect(page).toHaveURL(new RegExp(`/chat/${PROPERTY_ID}`), { timeout: 10000 });
  });

  test('should show price history chart when data exists', async ({ page }) => {
    mockProperty(page);
    mockFavoriteCheck(page);

    await loginUser(page);
    await page.goto(`/listing/${PROPERTY_ID}`);

    await expect(page.locator('h3:has-text("Price History")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=11% overall')).toBeVisible();
  });

  test('should show listing not found for invalid id', async ({ page }) => {
    page.route('**/api/properties/9999', (route) =>
      route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify(null) })
    );
    page.route('**/api/properties/9999/price-history', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );

    await page.goto('/listing/9999');
    await expect(page.locator('h3:has-text("Listing not found")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Back to search")')).toBeVisible();
  });
});
