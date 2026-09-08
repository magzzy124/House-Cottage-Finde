import { test, expect } from '@playwright/test';

const TEST_USER = {
  firstName: 'EditList',
  lastName: 'Tester',
  username: `editlisttester_${Date.now()}`,
  phone: '+1 555 333 4444',
  email: `editlist_${Date.now()}@example.com`,
  password: 'EditListPass123!',
};

const PROPERTY_ID = 42;

const MOCK_PROPERTY = {
  id: PROPERTY_ID,
  title: 'Existing Property',
  address: 'Knez Mihailova 12',
  city: 'Belgrade',
  dealType: 'For sale',
  price: 200000,
  bedrooms: 3,
  bathrooms: 2,
  area: 100,
  imageUrl: 'house.jpg',
  imageUrls: 'house.jpg,house2.jpg',
  latitude: 44.8176,
  longitude: 20.4569,
  description: 'A great property.',
};

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

function mockProperty(page: import('@playwright/test').Page) {
  page.route(`**/api/properties/${PROPERTY_ID}**`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROPERTY),
      });
    }
    if (route.request().method() === 'PUT') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Listing updated' }),
      });
    }
    route.fallback();
  });
}

test.describe('Edit Listing', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto(`/edit-listing/${PROPERTY_ID}`);
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should load and pre-fill form with existing data', async ({ page }) => {
    mockProperty(page);
    await loginUser(page);
    await page.goto(`/edit-listing/${PROPERTY_ID}`);
    await expect(page.locator('h1:has-text("Edit listing")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Back to listings")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Modern apartment"]')).toHaveValue('Existing Property');
  });

  test('should show back to listings link', async ({ page }) => {
    mockProperty(page);
    await loginUser(page);
    await page.goto(`/edit-listing/${PROPERTY_ID}`);
    await expect(page.locator('a:has-text("Back to listings")')).toBeVisible({ timeout: 10000 });
  });

  test('should update listing successfully', async ({ page }) => {
    mockProperty(page);
    await loginUser(page);
    await page.goto(`/edit-listing/${PROPERTY_ID}`);
    await expect(page.locator('h1:has-text("Edit listing")')).toBeVisible({ timeout: 10000 });

    const titleInput = page.locator('input[placeholder*="Modern apartment"]');
    await titleInput.clear();
    await titleInput.fill('Updated Property');

    await page.click('button:has-text("Save changes")');
    await expect(page.locator('text=Listing updated!')).toBeVisible({ timeout: 10000 });
  });

  test('should show save changes button', async ({ page }) => {
    mockProperty(page);
    await loginUser(page);
    await page.goto(`/edit-listing/${PROPERTY_ID}`);
    await expect(page.locator('button:has-text("Save changes")')).toBeVisible({ timeout: 10000 });
  });

  test('should show deal type toggle', async ({ page }) => {
    mockProperty(page);
    await loginUser(page);
    await page.goto(`/edit-listing/${PROPERTY_ID}`);
    await expect(page.locator('button:has-text("For sale")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("For rent")')).toBeVisible();
  });

  test('should toggle deal type', async ({ page }) => {
    mockProperty(page);
    await loginUser(page);
    await page.goto(`/edit-listing/${PROPERTY_ID}`);
    await expect(page.locator('button:has-text("For sale")')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("For rent")');
    await expect(page.locator('button:has-text("For rent")')).toHaveClass(/bg-white/);
  });

  test('should show pre-filled price', async ({ page }) => {
    mockProperty(page);
    await loginUser(page);
    await page.goto(`/edit-listing/${PROPERTY_ID}`);
    const priceInput = page.locator('input[type="number"]').first();
    await expect(priceInput).toBeVisible({ timeout: 10000 });
    await expect(priceInput).toHaveValue('200000');
  });
});
