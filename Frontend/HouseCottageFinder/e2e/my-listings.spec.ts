import { test, expect } from '@playwright/test';

const TEST_USER = {
  firstName: 'MyList',
  lastName: 'Tester',
  username: `mylisttester_${Date.now()}`,
  phone: '+1 555 111 2222',
  email: `mylist_${Date.now()}@example.com`,
  password: 'MyListPass123!',
};

const MOCK_LISTINGS = [
  {
    id: 1,
    title: 'Test House',
    address: 'Knez Mihailova 12',
    city: 'Belgrade',
    dealType: 'For sale',
    price: 200000,
    bedrooms: 3,
    bathrooms: 2,
    area: 100,
    imageUrl: 'house.jpg',
  },
  {
    id: 2,
    title: 'Test Apartment',
    address: 'Balkanska 5',
    city: 'Belgrade',
    dealType: 'For rent',
    price: 800,
    bedrooms: 2,
    bathrooms: 1,
    area: 55,
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

function mockMyListings(page: import('@playwright/test').Page, listings = MOCK_LISTINGS) {
  page.route('**/api/properties/my**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(listings),
    })
  );
}

function mockDeleteListing(page: import('@playwright/test').Page) {
    page.route('**/api/properties/1**', (route) => {
    if (route.request().method() === 'DELETE') {
      return route.fulfill({ status: 200, body: JSON.stringify({}) });
    }
    route.fallback();
  });
}

test.describe('My Listings', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/my-listings');
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should show empty state when no listings', async ({ page }) => {
    mockMyListings(page, []);
    await loginUser(page);
    await page.goto('/my-listings');
    await expect(page.locator('h3:has-text("No listings yet")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Create listing")')).toBeVisible();
  });

  test('should show listings with correct data', async ({ page }) => {
    mockMyListings(page);
    await loginUser(page);
    await page.goto('/my-listings');
    await expect(page.locator('h1:has-text("My Listings")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=2 listings')).toBeVisible();
    await expect(page.locator('h3:has-text("Test House")')).toBeVisible();
    await expect(page.locator('h3:has-text("Test Apartment")')).toBeVisible();
  });

  test('should show new listing button', async ({ page }) => {
    mockMyListings(page);
    await loginUser(page);
    await page.goto('/my-listings');
    await expect(page.locator('a:has-text("New listing")')).toBeVisible({ timeout: 10000 });
  });

  test('should click edit and navigate to edit page', async ({ page }) => {
    mockMyListings(page);
    await loginUser(page);
    await page.goto('/my-listings');
    const editBtn = page.locator('a[href*="/edit-listing/"]').first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();
    await expect(page).toHaveURL(/.*edit-listing\/.*/, { timeout: 10000 });
  });

  test('should delete listing removes it from list', async ({ page }) => {
    mockMyListings(page);
    mockDeleteListing(page);
    await loginUser(page);
    await page.goto('/my-listings');
    await expect(page.locator('h3:has-text("Test House")')).toBeVisible({ timeout: 10000 });

    const deleteBtn = page.locator('button').filter({ has: page.locator('svg path[d="M3 6h18"]') }).first();
    await deleteBtn.click();
    await expect(page.locator('h3:has-text("Test House")')).not.toBeVisible({ timeout: 5000 });
  });

  test('should click card navigates to listing detail', async ({ page }) => {
    mockMyListings(page);
    await loginUser(page);
    await page.goto('/my-listings');
    await expect(page.locator('h3:has-text("Test House")')).toBeVisible({ timeout: 10000 });
    await page.locator('h3:has-text("Test House")').click();
    await expect(page).toHaveURL(/.*listing\/.*/, { timeout: 10000 });
  });
});
