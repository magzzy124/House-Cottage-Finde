import { test, expect } from '@playwright/test';

const TEST_USER = {
  firstName: 'Notif',
  lastName: 'Tester',
  username: `notiftester_${Date.now()}`,
  phone: '+1 555 555 6666',
  email: `notif_${Date.now()}@example.com`,
  password: 'NotifPass123!',
};

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    propertyId: 10,
    title: 'New listing matches your search',
    message: 'A new property in Belgrade matches "Apartments in Belgrade"',
    isRead: false,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    propertyTitle: 'New Apartment',
  },
  {
    id: 2,
    propertyId: 20,
    title: 'Price drop alert',
    message: 'A saved listing dropped in price',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    propertyTitle: 'Price Drop House',
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

function mockNotifications(page: import('@playwright/test').Page, notifications = MOCK_NOTIFICATIONS) {
  page.route('**/api/notifications**', (route) => {
    if (route.request().method() === 'GET' && !route.request().url().includes('unread-count')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(notifications),
      });
    }
    if (route.request().method() === 'PUT') {
      return route.fulfill({ status: 200, body: JSON.stringify({}) });
    }
    route.fallback();
  });
}

function mockUnreadCount(page: import('@playwright/test').Page, count = 1) {
  page.route('**/api/notifications/unread-count**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count }),
    })
  );
}

test.describe('Notifications', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should show empty state when no notifications', async ({ page }) => {
    mockNotifications(page, []);
    mockUnreadCount(page, 0);
    await loginUser(page);
    await page.goto('/notifications');
    await expect(page.locator('h3:has-text("No notifications yet")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Go to search")')).toBeVisible();
  });

  test('should show notifications list', async ({ page }) => {
    mockNotifications(page);
    mockUnreadCount(page, 1);
    await loginUser(page);
    await page.goto('/notifications');
    await expect(page.locator('h1:has-text("Notifications")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=1 unread')).toBeVisible();
    await expect(page.locator('text=New listing matches your search')).toBeVisible();
    await expect(page.locator('text=Price drop alert')).toBeVisible();
  });

  test('should show mark all as read button when unread', async ({ page }) => {
    mockNotifications(page);
    mockUnreadCount(page, 1);
    await loginUser(page);
    await page.goto('/notifications');
    await expect(page.locator('button:has-text("Mark all as read")')).toBeVisible({ timeout: 10000 });
  });

  test('should hide mark all as read when all read', async ({ page }) => {
    mockNotifications(page, MOCK_NOTIFICATIONS.map((n) => ({ ...n, isRead: true })));
    mockUnreadCount(page, 0);
    await loginUser(page);
    await page.goto('/notifications');
    await expect(page.locator('text=All caught up')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Mark all as read")')).not.toBeVisible();
  });

  test('should mark all as read clears unread', async ({ page }) => {
    mockNotifications(page);
    mockUnreadCount(page, 1);
    await loginUser(page);
    await page.goto('/notifications');
    await expect(page.locator('button:has-text("Mark all as read")')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Mark all as read")');
    await expect(page.locator('text=All caught up')).toBeVisible({ timeout: 5000 });
  });

  test('should show saved searches link', async ({ page }) => {
    mockNotifications(page, []);
    mockUnreadCount(page, 0);
    await loginUser(page);
    await page.goto('/notifications');
    await expect(page.locator('a:has-text("Saved searches")')).toBeVisible({ timeout: 10000 });
  });

  test('should click notification navigates to listing', async ({ page }) => {
    mockNotifications(page);
    mockUnreadCount(page, 1);
    await loginUser(page);
    await page.goto('/notifications');
    await expect(page.locator('text=New listing matches your search')).toBeVisible({ timeout: 10000 });
    await page.locator('text=New listing matches your search').click();
    await expect(page).toHaveURL(/.*listing\/.*/, { timeout: 10000 });
  });
});
