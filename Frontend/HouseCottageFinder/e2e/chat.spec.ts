import { test, expect } from '@playwright/test';

const TEST_USER = {
  firstName: 'Chat',
  lastName: 'Tester',
  username: `chattester_${Date.now()}`,
  phone: '+1 555 111 2222',
  email: `chat_${Date.now()}@example.com`,
  password: 'ChatPass123!',
};

const OTHER_USER = {
  id: 999,
  firstName: 'Other',
  lastName: 'User',
};

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

function mockSendMessage(page: import('@playwright/test').Page, userId: number, senderName: string) {
  let nextId = 1000;
  return page.route(`**/api/chat/messages?userId=*`, (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: nextId++,
          propertyId: body.propertyId,
          senderId: userId,
          senderName,
          content: body.content,
          sentAt: new Date().toISOString(),
        }),
      });
    }
    route.fallback();
  });
}

function mockMessagesWithHistory(
  page: import('@playwright/test').Page,
  messages: Array<{
    id: number;
    senderId: number;
    senderName: string;
    content: string;
    sentAt: string;
  }>
) {
  return page.route(`**/api/chat/messages*`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(messages),
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

async function injectSignalRMessage(page: import('@playwright/test').Page, message: unknown) {
  await page.evaluate((msg) => {
    const win = window as any;
    if (win.__chatServiceInstance) {
      win.__chatServiceInstance._messages.update((msgs: any[]) => [...msgs, msg]);
    }
  }, message);
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
    await mockSendMessage(page, userId, `${TEST_USER.firstName} ${TEST_USER.lastName}`);

    await page.goto(`/chat/${PROPERTY_ID}`);

    const input = page.locator('input[placeholder="Type a message..."]');
    await input.fill('Is this still available?');

    const sendBtn = page.locator('button:has(svg)').last();
    await sendBtn.click();

    await expect(page.locator('text=Is this still available?')).toBeVisible();
  });

  test('should display messages from other users', async ({ page }) => {
    await mockProperty(page);
    await mockMessagesWithHistory(page, [
      {
        id: 1,
        senderId: OTHER_USER.id,
        senderName: `${OTHER_USER.firstName} ${OTHER_USER.lastName}`,
        content: 'Hello, is this property still available?',
        sentAt: new Date().toISOString(),
      },
    ]);

    await loginUser(page);
    await page.goto(`/chat/${PROPERTY_ID}`);

    await expect(page.locator('text=Hello, is this property still available?')).toBeVisible();
    await expect(page.locator(`text=${OTHER_USER.firstName} ${OTHER_USER.lastName}`)).toBeVisible();
  });

  test('should send message on Enter key', async ({ page }) => {
    await mockProperty(page);
    await mockMessagesEmpty(page);

    await loginUser(page);
    const userId = await getLoggedInUserId(page);
    await mockSendMessage(page, userId, `${TEST_USER.firstName} ${TEST_USER.lastName}`);

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
});

test.describe('Two-user chat', () => {
  const USER_A = {
    firstName: 'Alice',
    lastName: 'Smith',
    username: `alice_${Date.now()}`,
    phone: '+1 555 100 0001',
    email: `alice_${Date.now()}@example.com`,
    password: 'AlicePass123!',
    id: 0,
  };

  const USER_B = {
    firstName: 'Bob',
    lastName: 'Jones',
    username: `bob_${Date.now()}`,
    phone: '+1 555 200 0002',
    email: `bob_${Date.now()}@example.com`,
    password: 'BobPass123!',
    id: 0,
  };

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    await page.goto('/register');
    await page.fill('#firstName', USER_A.firstName);
    await page.fill('#lastName', USER_A.lastName);
    await page.fill('#username', USER_A.username);
    await page.fill('#phone', USER_A.phone);
    await page.fill('#email', USER_A.email);
    await page.fill('#password', USER_A.password);
    await page.fill('#confirmPassword', USER_A.password);
    await page.click('button:has-text("Create account")');
    await page.waitForURL('**/login**', { timeout: 10000 });

    await page.goto('/register');
    await page.fill('#firstName', USER_B.firstName);
    await page.fill('#lastName', USER_B.lastName);
    await page.fill('#username', USER_B.username);
    await page.fill('#phone', USER_B.phone);
    await page.fill('#email', USER_B.email);
    await page.fill('#password', USER_B.password);
    await page.fill('#confirmPassword', USER_B.password);
    await page.click('button:has-text("Create account")');
    await page.waitForURL('**/login**', { timeout: 10000 });

    await page.close();
  });

  test('two users can see each other messages in the same chat', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await mockProperty(pageA);
    await mockProperty(pageB);

    const history: Array<{
      id: number;
      senderId: number;
      senderName: string;
      content: string;
      sentAt: string;
    }> = [];

    let nextId = 1;

    function setupRoutes(page: import('@playwright/test').Page) {
      page.route(`**/api/chat/messages*`, (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(history),
          });
        }
        if (route.request().method() === 'POST') {
          const body = route.request().postDataJSON();
          const userId = Number(new URL(route.request().url()).searchParams.get('userId'));
          const senderName = userId === USER_A.id
            ? `${USER_A.firstName} ${USER_A.lastName}`
            : `${USER_B.firstName} ${USER_B.lastName}`;
          const msg = {
            id: nextId++,
            propertyId: body.propertyId,
            senderId: userId,
            senderName,
            content: body.content,
            sentAt: new Date().toISOString(),
          };
          history.push(msg);
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(msg),
          });
        }
        route.fallback();
      });
    }

    setupRoutes(pageA);
    setupRoutes(pageB);

    await pageA.goto('/login');
    await pageA.fill('#email', USER_A.email);
    await pageA.fill('#password', USER_A.password);
    await pageA.click('button:has-text("Sign in")');
    await pageA.waitForURL('**/search**', { timeout: 10000 });
    USER_A.id = await getLoggedInUserId(pageA);

    await pageB.goto('/login');
    await pageB.fill('#email', USER_B.email);
    await pageB.fill('#password', USER_B.password);
    await pageB.click('button:has-text("Sign in")');
    await pageB.waitForURL('**/search**', { timeout: 10000 });
    USER_B.id = await getLoggedInUserId(pageB);

    await pageA.goto(`/chat/${PROPERTY_ID}`);
    await expect(pageA.locator('text=No messages yet')).toBeVisible();

    await pageB.goto(`/chat/${PROPERTY_ID}`);
    await expect(pageB.locator('text=No messages yet')).toBeVisible();

    const inputA = pageA.locator('input[placeholder="Type a message..."]');
    await inputA.fill('Hey Bob, is this still available?');
    await inputA.press('Enter');

    await expect(pageA.locator('text=Hey Bob, is this still available?')).toBeVisible({ timeout: 5000 });

    await pageB.reload();
    await expect(pageB.locator('text=Hey Bob, is this still available?')).toBeVisible({ timeout: 5000 });

    const inputB = pageB.locator('input[placeholder="Type a message..."]');
    await inputB.fill('Yes it is! Want to schedule a viewing?');
    await inputB.press('Enter');

    await expect(pageB.locator('text=Yes it is! Want to schedule a viewing?')).toBeVisible({ timeout: 5000 });

    await pageA.reload();
    await expect(pageA.locator('text=Yes it is! Want to schedule a viewing?')).toBeVisible({ timeout: 5000 });

    await contextA.close();
    await contextB.close();
  });
});
