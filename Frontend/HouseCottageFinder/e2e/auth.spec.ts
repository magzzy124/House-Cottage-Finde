import { test, expect } from '@playwright/test';

const NEW_USER = {
  firstName: 'Auth',
  lastName: 'Tester',
  username: `authtester_${Date.now()}`,
  phone: '+1 555 333 4444',
  email: `auth_${Date.now()}@example.com`,
  password: 'AuthPass123!',
};

const EXISTING_USER = {
  firstName: 'Existing',
  lastName: 'User',
  username: `existing_${Date.now()}`,
  phone: '+1 555 555 6666',
  email: `existing_${Date.now()}@example.com`,
  password: 'ExistPass123!',
};

async function fillRegisterForm(
  page: import('@playwright/test').Page,
  user: typeof NEW_USER
) {
  await page.goto('/register');
  await page.fill('#firstName', user.firstName);
  await page.fill('#lastName', user.lastName);
  await page.fill('#username', user.username);
  await page.fill('#phone', user.phone);
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);
  await page.fill('#confirmPassword', user.password);
}

test.describe('Auth flows', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/register');
    await page.fill('#firstName', EXISTING_USER.firstName);
    await page.fill('#lastName', EXISTING_USER.lastName);
    await page.fill('#username', EXISTING_USER.username);
    await page.fill('#phone', EXISTING_USER.phone);
    await page.fill('#email', EXISTING_USER.email);
    await page.fill('#password', EXISTING_USER.password);
    await page.fill('#confirmPassword', EXISTING_USER.password);
    await page.click('button:has-text("Create account")');
    await page.waitForURL('**/login**', { timeout: 10000 });
    await page.close();
  });

  test.describe('Registration', () => {
    test('should show all form fields', async ({ page }) => {
      await page.goto('/register');
      await expect(page.locator('h1:has-text("Create account")')).toBeVisible();
      await expect(page.locator('#firstName')).toBeVisible();
      await expect(page.locator('#lastName')).toBeVisible();
      await expect(page.locator('#username')).toBeVisible();
      await expect(page.locator('#phone')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('#confirmPassword')).toBeVisible();
      await expect(page.locator('button:has-text("Create account")')).toBeVisible();
    });

    test('should register successfully and redirect to login', async ({ page }) => {
      await fillRegisterForm(page, NEW_USER);
      await page.click('button:has-text("Create account")');
      await page.waitForURL(/.*login.*/, { timeout: 10000 });
      await expect(page.locator('text=Account created! Please sign in.')).toBeVisible();
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto('/register');
      await page.fill('#firstName', 'Test');
      await page.fill('#lastName', 'User');
      await page.fill('#username', `test_${Date.now()}`);
      await page.fill('#phone', '+1 555 000 0000');
      await page.fill('#email', `test_${Date.now()}@example.com`);
      await page.fill('#password', 'Password1!');
      await page.fill('#confirmPassword', 'Different1!');
      await page.click('button:has-text("Create account")');
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });

    test('should navigate to login from register page', async ({ page }) => {
      await page.goto('/register');
      await page.click('a:has-text("Sign in")');
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Login', () => {
    test('should show all form fields', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
    });

    test('should login successfully and redirect to search', async ({ page }) => {
      await page.goto('/login');
      await page.fill('#email', EXISTING_USER.email);
      await page.fill('#password', EXISTING_USER.password);
      await page.click('button:has-text("Sign in")');
      await page.waitForURL('**/search', { timeout: 10000 });
    });

    test('should navigate to register from login page', async ({ page }) => {
      await page.goto('/login');
      await page.click('a:has-text("Sign up")');
      await expect(page).toHaveURL(/.*register/);
    });
  });

  test.describe('Logout', () => {
    test('should logout and show sign in button', async ({ page }) => {
      await page.goto('/login');
      await page.fill('#email', EXISTING_USER.email);
      await page.fill('#password', EXISTING_USER.password);
      await page.click('button:has-text("Sign in")');
      await page.waitForURL('**/search', { timeout: 10000 });

      await expect(page.locator('text=Log out')).toBeVisible();
      await page.click('text=Log out');
      await expect(page.locator('a:has-text("Sign in")')).toBeVisible();
    });

    test('should not show protected nav items after logout', async ({ page }) => {
      await page.goto('/login');
      await page.fill('#email', EXISTING_USER.email);
      await page.fill('#password', EXISTING_USER.password);
      await page.click('button:has-text("Sign in")');
      await page.waitForURL('**/search', { timeout: 10000 });

      await page.click('text=Log out');
      await expect(page.locator('a[routerLink="/my-listings"]')).not.toBeVisible();
    });
  });
});
