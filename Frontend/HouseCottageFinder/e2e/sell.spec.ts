import { test, expect } from '@playwright/test';

const TEST_USER = {
  firstName: 'Test',
  lastName: 'User',
  username: `testuser_${Date.now()}`,
  phone: '+1 555 000 0000',
  email: `test_${Date.now()}@example.com`,
  password: 'TestPass123!',
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

test.describe('Selling flow', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/sell');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show all form fields when authenticated', async ({ page }) => {
    await loginUser(page);
    await page.goto('/sell');

    await expect(page.locator('h1:has-text("Create a listing")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Modern apartment"]')).toBeVisible();
    await expect(page.locator('geoapify-geocoder-autocomplete')).toBeVisible();
    await expect(page.locator('button:has-text("For sale")')).toBeVisible();
    await expect(page.locator('button:has-text("For rent")')).toBeVisible();
    await expect(page.locator('input[placeholder="0"]').first()).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Describe"]')).toBeVisible();
    await expect(page.locator('button:has-text("Publish listing")')).toBeVisible();
  });

  test('should show validation error when submitting empty form', async ({ page }) => {
    await loginUser(page);
    await page.goto('/sell');
    await page.click('button:has-text("Publish listing")');
    await expect(page.locator('text=Please fill in all required fields')).toBeVisible();
  });

  test('should toggle deal type between sale and rent', async ({ page }) => {
    await loginUser(page);
    await page.goto('/sell');

    const saleBtn = page.locator('button:has-text("For sale")');
    const rentBtn = page.locator('button:has-text("For rent")');

    await expect(saleBtn).toHaveClass(/bg-white/);
    await rentBtn.click();
    await expect(rentBtn).toHaveClass(/bg-white/);
  });

  test('should show success after creating a listing', async ({ page }) => {
    await page.route('**/v1/geocode/autocomplete**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                formatted: 'Knez Mihailova 12, Belgrade',
                city: 'Belgrade',
                lat: 44.8176,
                lon: 20.4569,
              },
            },
          ],
        }),
      });
    });

    await loginUser(page);
    await page.goto('/sell');

    await page.fill('input[placeholder*="Modern apartment"]', 'E2E Test House');

    const addressInput = page.locator('geoapify-geocoder-autocomplete input');
    await addressInput.fill('Knez Mihailova 12');
    await page.waitForTimeout(1500);
    const suggestion = page.locator('.geoapify-autocomplete-items div').first();
    if (await suggestion.isVisible()) {
      await suggestion.click();
      await page.waitForTimeout(500);
    }

    await page.fill('input[type="number"][placeholder="0"]:visible >> nth=0', '150000');
    await page.fill('input[type="number"][placeholder="0"]:visible >> nth=1', '3');
    await page.fill('input[type="number"][placeholder="0"]:visible >> nth=2', '2');
    await page.fill('input[type="number"][placeholder="0"]:visible >> nth=3', '85');
    await page.fill('textarea[placeholder*="Describe"]', 'E2E test listing description');

    await page.click('button:has-text("Publish listing")');
    await expect(page.locator('text=Listing created!')).toBeVisible({ timeout: 10000 });
  });
});
