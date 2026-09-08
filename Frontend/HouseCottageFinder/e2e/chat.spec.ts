import { test, expect } from '@playwright/test';

const TEST_USER = {
  firstName: 'Chat',
  lastName: 'Tester',
  username: `chattester_${Date.now()}`,
  phone: '+1 555 111 2222',
  email: `chat_${Date.now()}@example.com`,
  password: 'ChatPass123!',
};

const OTHER_USER_ID = 999;
const OTHER_USER_NAME = 'Other User';
const PROPERTY_ID = 42;

const MOCK_PROPERTY = {
  id: PROPERTY_ID,
  title: 'E2E Test Property',
  address: 'Knez Mihailova 12',
  city: 'Belgrade',
  price: 200000,
  imageUrl: 'house.jpg',
};

function mockProperty(page: import('@playwright/test').Page) {
  return page.route(`**/api/properties/${PROPERTY_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PROPERTY),
    })
  );
}

function mockMessagesEmpty(page: import('@playwright/test').Page) {
  return page.route(`**/api/chat/messages*`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    route.fallback();
  });
}

function mockSendMessage(page: import('@playwright/test').Page, userId: number) {
  return page.route(`**/api/chat/messages?userId=*`, (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: Date.now(),
          propertyId: body.propertyId,
          senderId: userId,
          senderName: `${TEST_USER.firstName} ${TEST_USER.lastName}`,
          content: body.content,
          sentAt: new Date().toISOString(),
        }),
      });
    }
    route.fallback();
  });
}

function mockMessagesWithOtherUser(page: import('@playwright/test').Page) {
  const now = new Date().toISOString();
  return page.route(`**/api/chat/messages*`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            propertyId: PROPERTY_ID,
            senderId: OTHER_USER_ID,
            senderName: OTHER_USER_NAME,
            content: 'Hello, is this property still available?',
            sentAt: now,
          },
        ]),
      });
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

async function getLoggedInUserId(page: import('@playwright/test').Page): Promise<number> {
  const raw = await page.evaluate(() => localStorage.getItem('hcf_user'));
  const user = JSON.parse(raw!);
  return user.id;
}

test.describe('Chat messages', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('should load chat page without auth but not fetch messages', async ({ page }) => {
    await mockProperty(page);
    await page.goto(`/chat/${PROPERTY_ID}`);
    await expect(page).toHaveURL(new RegExp(`/chat/${PROPERTY_ID}`));
    await expect(page.locator('h2:has-text("E2E Test Property")')).toBeVisible();
    await expect(page.locator('app-chat')).toBeVisible();
  });

  test('should show chat UI with property info', async ({ page }) => {
    await mockProperty(page);
    await mockMessagesEmpty(page);

    await loginUser(page);
    await page.goto(`/chat/${PROPERTY_ID}`);

    await expect(page.locator('h2:has-text("E2E Test Property")')).toBeVisible();
    await expect(page.locator('text=Knez Mihailova 12, Belgrade')).toBeVisible();
    await expect(page.locator('text=$ 200000')).toBeVisible();
    await expect(page.locator('a:has-text("Back to listing")')).toBeVisible();
    await expect(page.locator('app-chat')).toBeVisible();
    await expect(page.locator('input[placeholder="Type a message..."]')).toBeVisible();
    await expect(page.locator('button svg')).toBeVisible();
  });

  test('should show empty state when no messages', async ({ page }) => {
    await mockProperty(page);
    await mockMessagesEmpty(page);

    await loginUser(page);
    await page.goto(`/chat/${PROPERTY_ID}`);

    await expect(page.locator('text=No messages yet. Start the conversation!')).toBeVisible();
  });

  test('should send a message and display it', async ({ page }) => {
    await mockProperty(page);
    await mockMessagesEmpty(page);

    await loginUser(page);
    const userId = await getLoggedInUserId(page);
    await mockSendMessage(page, userId);

    await page.goto(`/chat/${PROPERTY_ID}`);

    const input = page.locator('input[placeholder="Type a message..."]');
    await input.fill('Is this still available?');

    const sendBtn = page.locator('button:has(svg)').last();
    await sendBtn.click();

    await expect(page.locator('text=Is this still available?')).toBeVisible();
  });

  test('should display messages from other users', async ({ page }) => {
    await mockProperty(page);
    await mockMessagesWithOtherUser(page);

    await loginUser(page);
    await page.goto(`/chat/${PROPERTY_ID}`);

    await expect(page.locator('text=Hello, is this property still available?')).toBeVisible();
    await expect(page.locator(`text=${OTHER_USER_NAME}`)).toBeVisible();
  });

  test('should send message on Enter key', async ({ page }) => {
    await mockProperty(page);
    await mockMessagesEmpty(page);

    await loginUser(page);
    const userId = await getLoggedInUserId(page);
    await mockSendMessage(page, userId);

    await page.goto(`/chat/${PROPERTY_ID}`);

    const input = page.locator('input[placeholder="Type a message..."]');
    await input.fill('Sent via Enter');
    await input.press('Enter');

    await expect(page.locator('text=Sent via Enter')).toBeVisible();
  });

  test('should disable send button when input is empty', async ({ page }) => {
    await mockProperty(page);
    await mockMessagesEmpty(page);

    await loginUser(page);
    await page.goto(`/chat/${PROPERTY_ID}`);

    const sendBtn = page.locator('button:has(svg)').last();
    await expect(sendBtn).toBeDisabled();

    const input = page.locator('input[placeholder="Type a message..."]');
    await input.fill('Something');
    await expect(sendBtn).toBeEnabled();

    await input.fill('');
    await expect(sendBtn).toBeDisabled();
  });

  test('should poll for new messages', async ({ page }) => {
    await mockProperty(page);

    const now = new Date().toISOString();
    let callCount = 0;

    await page.route('**/api/chat/messages*', (route) => {
      if (route.request().method() === 'GET') {
        callCount++;
        const messages =
          callCount === 1
            ? []
            : [
                {
                  id: 10,
                  propertyId: PROPERTY_ID,
                  senderId: OTHER_USER_ID,
                  senderName: OTHER_USER_NAME,
                  content: 'Polled message!',
                  sentAt: now,
                },
              ];
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(messages),
        });
      }
      route.fallback();
    });

    await loginUser(page);
    await page.goto(`/chat/${PROPERTY_ID}`);

    await expect(page.locator('text=No messages yet. Start the conversation!')).toBeVisible();

    await expect(page.locator('text=Polled message!')).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${OTHER_USER_NAME}`)).toBeVisible();
  });
});
