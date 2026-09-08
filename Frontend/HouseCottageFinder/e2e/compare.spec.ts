import { test, expect } from '@playwright/test';

const MOCK_PROPERTIES = [
  {
    id: 1,
    title: 'House Alpha',
    address: 'Knez Mihailova 12',
    city: 'Belgrade',
    dealType: 'For sale',
    price: 200000,
    bedrooms: 3,
    bathrooms: 2,
    area: 100,
    imageUrl: 'house.jpg',
    latitude: 44.8176,
    longitude: 20.4569,
    description: 'Spacious house',
    imageUrls: '',
  },
  {
    id: 2,
    title: 'House Beta',
    address: 'Balkanska 5',
    city: 'Belgrade',
    dealType: 'For rent',
    price: 800,
    bedrooms: 2,
    bathrooms: 1,
    area: 55,
    imageUrl: 'house.jpg',
    latitude: 44.8048,
    longitude: 20.4781,
    description: 'Cozy apartment',
    imageUrls: '',
  },
];

function mockProperties(page: import('@playwright/test').Page) {
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
}

test.describe('Compare feature', () => {
  test('should show empty state on compare page', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.locator('h3:has-text("No listings to compare")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Browse listings")')).toBeVisible();
  });

  test('should show add more link and clear all button when empty', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.locator('a:has-text("Add more")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Clear all")')).toBeVisible();
  });

  test('should add items from search and show compare bar', async ({ page }) => {
    mockProperties(page);
    await page.goto('/search');
    await expect(page.locator('app-card').first()).toBeVisible({ timeout: 10000 });

    const compareBtn = page.locator('app-card').first().locator('button[title="Compare"]');
    await compareBtn.click();
    await expect(page.locator('text=1 / 4 selected')).toBeVisible();
  });

  test('should add multiple items to compare', async ({ page }) => {
    mockProperties(page);
    await page.goto('/search');
    await expect(page.locator('app-card').first()).toBeVisible({ timeout: 10000 });

    await page.locator('app-card').first().locator('button[title="Compare"]').click();
    await page.locator('app-card').nth(1).locator('button[title="Compare"]').click();
    await expect(page.locator('text=2 / 4 selected')).toBeVisible();
  });

  test('should navigate to compare page from bar', async ({ page }) => {
    mockProperties(page);
    await page.goto('/search');
    await expect(page.locator('app-card').first()).toBeVisible({ timeout: 10000 });

    await page.locator('app-card').first().locator('button[title="Compare"]').click();
    await page.click('a:has-text("Compare now")');
    await expect(page).toHaveURL(/.*compare/, { timeout: 10000 });
  });

  test('should show comparison table with correct data', async ({ page }) => {
    mockProperties(page);
    await page.goto('/search');
    await expect(page.locator('app-card').first()).toBeVisible({ timeout: 10000 });

    await page.locator('app-card').first().locator('button[title="Compare"]').click();
    await page.locator('app-card').nth(1).locator('button[title="Compare"]').click();
    await page.click('a:has-text("Compare now")');

    await expect(page.locator('h1:has-text("Compare Properties")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=2 listings selected')).toBeVisible();
    await expect(page.locator('text=House Alpha')).toBeVisible();
    await expect(page.locator('text=House Beta')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Price', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Bedrooms', exact: true })).toBeVisible();
  });

  test('should remove item from comparison', async ({ page }) => {
    mockProperties(page);
    await page.goto('/search');
    await expect(page.locator('app-card').first()).toBeVisible({ timeout: 10000 });

    await page.locator('app-card').first().locator('button[title="Compare"]').click();
    await page.locator('app-card').nth(1).locator('button[title="Compare"]').click();
    await page.click('a:has-text("Compare now")');

    await expect(page.locator('text=2 listings selected')).toBeVisible({ timeout: 10000 });
    const removeBtn = page.locator('button:has-text("Remove")').first();
    await removeBtn.click();
    await expect(page.locator('text=1 listing selected')).toBeVisible({ timeout: 5000 });
  });

  test('should clear all redirects to search', async ({ page }) => {
    mockProperties(page);
    await page.goto('/search');
    await expect(page.locator('app-card').first()).toBeVisible({ timeout: 10000 });

    await page.locator('app-card').first().locator('button[title="Compare"]').click();
    await page.click('a:has-text("Compare now")');

    await expect(page.locator('h1:has-text("Compare Properties")')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Clear all")');
    await expect(page).toHaveURL(/.*search/, { timeout: 10000 });
  });

  test('should show view details link for each item', async ({ page }) => {
    mockProperties(page);
    await page.goto('/search');
    await expect(page.locator('app-card').first()).toBeVisible({ timeout: 10000 });

    await page.locator('app-card').first().locator('button[title="Compare"]').click();
    await page.click('a:has-text("Compare now")');

    await expect(page.locator('button:has-text("View details")').first()).toBeVisible({ timeout: 10000 });
  });
});
