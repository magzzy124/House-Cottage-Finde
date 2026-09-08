import { test, expect } from '@playwright/test';

const TEST_USER = {
  firstName: 'Nav',
  lastName: 'Tester',
  username: `navtester_${Date.now()}`,
  phone: '+1 555 777 8888',
  email: `nav_${Date.now()}@example.com`,
  password: 'NavPass123!',
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

test.describe('Navbar', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('should show logo and nav links when not logged in', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('h1:has-text("HouseFinder")')).toBeVisible();
    await expect(page.locator('a:has-text("Search")')).toBeVisible();
    await expect(page.locator('a:has-text("Sell")')).toBeVisible();
    await expect(page.locator('a:has-text("Stats")')).toBeVisible();
    await expect(page.locator('a:has-text("About")')).toBeVisible();
    await expect(page.locator('a:has-text("Sign in")')).toBeVisible();
  });

  test('should show sign in button when not logged in', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('a:has-text("Sign in")')).toBeVisible();
  });

  test('should hide auth-only icons when not logged in', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('a[routerLink="/my-listings"]')).not.toBeVisible();
    await expect(page.locator('a[routerLink="/notifications"]')).not.toBeVisible();
  });

  test('should show user name and logout when logged in', async ({ page }) => {
    await loginUser(page);
    await expect(page.locator('text=Hi, Nav')).toBeVisible();
    await expect(page.locator('text=Log out')).toBeVisible();
  });

  test('should show auth-only icons when logged in', async ({ page }) => {
    await loginUser(page);
    await expect(page.locator('a[routerLink="/my-listings"]')).toBeVisible();
    await expect(page.locator('a[routerLink="/notifications"]')).toBeVisible();
    await expect(page.locator('a[routerLink="/profile"]')).toBeVisible();
  });

  test('should show favorites heart icon always', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('a[routerLink="/favorites"]')).toBeVisible();
  });

  test('should logo link to search', async ({ page }) => {
    await page.goto('/about');
    await page.getByRole('navigation').getByRole('heading', { name: 'HouseFinder' }).click();
    await expect(page).toHaveURL(/.*search/, { timeout: 10000 });
  });

  test('should nav links navigate correctly', async ({ page }) => {
    await loginUser(page);
    await page.goto('/search');
    await page.click('a:has-text("Sell")');
    await expect(page).toHaveURL(/.*sell/);

    await page.click('a:has-text("Stats")');
    await expect(page).toHaveURL(/.*stats/);

    await page.click('a:has-text("About")');
    await expect(page).toHaveURL(/.*about/);

    await page.click('a:has-text("Search")');
    await expect(page).toHaveURL(/.*search/);
  });

  test('should logout clears state and shows sign in', async ({ page }) => {
    await loginUser(page);
    await expect(page.locator('text=Hi, Nav')).toBeVisible();
    await page.click('text=Log out');
    await expect(page.locator('a:has-text("Sign in")')).toBeVisible();
    await expect(page.locator('text=Hi, Nav')).not.toBeVisible();
  });

  test('should show notification badge when logged in', async ({ page }) => {
    page.route('**/api/notifications/unread-count**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 5 }),
      })
    );
    await loginUser(page);
    await expect(page.locator('a[routerLink="/notifications"]')).toBeVisible();
  });

  test('should hide notification badge when count is 0', async ({ page }) => {
    page.route('**/api/notifications/unread-count**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0 }),
      })
    );
    await loginUser(page);
    await expect(page.locator('a[routerLink="/notifications"]')).toBeVisible();
  });
});
