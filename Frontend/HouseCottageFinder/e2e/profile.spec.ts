import { test, expect } from '@playwright/test';

const TEST_USER = {
  firstName: 'Profile',
  lastName: 'Tester',
  username: `profiletester_${Date.now()}`,
  phone: '+1 555 333 4444',
  email: `profile_${Date.now()}@example.com`,
  password: 'ProfilePass123!',
};

const MOCK_PROFILE = {
  id: 1,
  firstName: 'Profile',
  lastName: 'Tester',
  username: `profiletester`,
  phone: '+1 555 333 4444',
  email: `profile_test@example.com`,
  createdAt: '2024-01-15T00:00:00Z',
  favoritesCount: 3,
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

function mockProfile(page: import('@playwright/test').Page) {
  page.route('**/api/auth/profile**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROFILE),
      });
    }
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: MOCK_PROFILE.id,
          firstName: body.firstName || MOCK_PROFILE.firstName,
          lastName: body.lastName || MOCK_PROFILE.lastName,
          username: MOCK_PROFILE.username,
          email: MOCK_PROFILE.email,
          message: 'Profile updated successfully',
        }),
      });
    }
    route.fallback();
  });
}

test.describe('Profile', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should display profile information', async ({ page }) => {
    mockProfile(page);

    await loginUser(page);
    await page.goto('/profile');

    await expect(page.locator('h1:has-text("My Profile")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Profile Tester")')).toBeVisible();
    await expect(page.locator('text=@profiletester')).toBeVisible();
    await expect(page.locator('text=profile_test@example.com')).toBeVisible();
    await expect(page.locator('text=+1 555 333 4444')).toBeVisible();
    await expect(page.locator('text=3 saved')).toBeVisible();
  });

  test('should show edit form with pre-filled values', async ({ page }) => {
    mockProfile(page);

    await loginUser(page);
    await page.goto('/profile');

    await expect(page.locator('h2:has-text("Edit profile")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Save changes")')).toBeVisible();
    await expect(page.locator('text=Change password')).toBeVisible();
  });

  test('should update profile successfully', async ({ page }) => {
    mockProfile(page);

    await loginUser(page);
    await page.goto('/profile');

    await expect(page.locator('h2:has-text("Edit profile")')).toBeVisible({ timeout: 10000 });

    const firstNameInput = page.locator('input[type="text"]').first();
    await firstNameInput.clear();
    await firstNameInput.fill('Updated');

    await page.click('button:has-text("Save changes")');
    await expect(page.locator('text=Profile updated successfully')).toBeVisible({ timeout: 10000 });
  });

  test('should show error for mismatched new passwords', async ({ page }) => {
    mockProfile(page);

    await loginUser(page);
    await page.goto('/profile');

    await expect(page.locator('h2:has-text("Edit profile")')).toBeVisible({ timeout: 10000 });

    await page.fill('input[placeholder="Enter current password"]', TEST_USER.password);
    await page.fill('input[placeholder="New password"]', 'NewPass1!');
    await page.fill('input[placeholder="Confirm password"]', 'DifferentPass1!');

    await page.click('button:has-text("Save changes")');
    await expect(page.locator('text=New passwords do not match')).toBeVisible();
  });

  test('should show member since date', async ({ page }) => {
    mockProfile(page);

    await loginUser(page);
    await page.goto('/profile');

    await expect(page.locator('text=Member since')).toBeVisible({ timeout: 10000 });
  });

  test('should show view favorites link', async ({ page }) => {
    mockProfile(page);

    await loginUser(page);
    await page.goto('/profile');

    await expect(page.locator('a:has-text("View favorites")')).toBeVisible({ timeout: 10000 });
  });
});
