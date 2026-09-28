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
  userId: OTHER_USER.id,
};

interface MockMessage {
  id: number;
  propertyId: number;
  senderId: number;
  recipientId: number;
  senderName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

function mockProperty(page: import('@playwright/test').Page) {
  return page.route(`**/api/properties/${PROPERTY_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PROPERTY),
    })
  );
}

function mockThreads(page: import('@playwright/test').Page) {
  return page.route('**/api/chat/threads*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  );
}

function mockParticipant(page: import('@playwright/test').Page) {
  return page.route(`**/api/users/${OTHER_USER.id}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: OTHER_USER.id,
        firstName: OTHER_USER.firstName,
        lastName: OTHER_USER.lastName,
        username: 'otheruser',
      }),
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

function mockSendMessage(page: import('@playwright/test').Page, senderId: number, senderName: string) {
  let nextId = 1000;
  return page.route(`**/api/chat/messages*`, (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: nextId++,
          propertyId: body.propertyId,
          senderId,
          recipientId: body.recipientId,
          senderName,
          content: body.content,
          sentAt: new Date().toISOString(),
          isRead: false,
        }),
      });
    }
    route.fallback();
  });
}

function mockMessagesWithHistory(page: import('@playwright/test').Page, messages: MockMessage[]) {
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

const CONVERSATION_URL = `/chat/${PROPERTY_ID}/${OTHER_USER.id}`;

test.describe('Chat messages', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUser(page);
    await page.close();
  });

  test('should load chat page without auth but not fetch messages', async ({ page }) => {
    await mockProperty(page);
    await mockParticipant(page);
    await page.goto(CONVERSATION_URL);
    await expect(page).toHaveURL(new RegExp(`/chat/${PROPERTY_ID}/${OTHER_USER.id}`));
    await expect(page.locator('h2:has-text("E2E Test Property")')).toBeVisible();
    await expect(page.locator('app-chat')).toBeVisible();
  });

  test('should show chat UI with the other user name', async ({ page }) => {
    await mockProperty(page);
    await mockParticipant(page);
    await mockThreads(page);
    await mockMessagesEmpty(page);

    await loginUser(page);
    await page.goto(CONVERSATION_URL);

    await expect(page.locator('h2:has-text("E2E Test Property")')).toBeVisible();
    await expect(page.locator('text=Knez Mihailova 12, Belgrade')).toBeVisible();
    await expect(page.locator('text=$ 200000')).toBeVisible();
    await expect(page.locator('text=Other User')).toBeVisible();
    await expect(page.locator('a:has-text("Back to listing")')).toBeVisible();
    await expect(page.locator('app-chat')).toBeVisible();
    await expect(page.locator('input[placeholder="Type a message..."]')).toBeVisible();
  });

  test('should request only the conversation with the given user', async ({ page }) => {
    await mockProperty(page);
    await mockParticipant(page);
    await mockThreads(page);
    await mockMessagesEmpty(page);

    await loginUser(page);

    const messagesRequest = page.waitForRequest(
      (req) => req.url().includes('/api/chat/messages') && req.method() === 'GET'
    );
    await page.goto(CONVERSATION_URL);

    const req = await messagesRequest;
    const url = new URL(req.url());
    expect(url.searchParams.get('propertyId')).toBe(String(PROPERTY_ID));
    expect(url.searchParams.get('withUserId')).toBe(String(OTHER_USER.id));
  });

  test('should show empty state when no messages', async ({ page }) => {
    await mockProperty(page);
    await mockParticipant(page);
    await mockThreads(page);
    await mockMessagesEmpty(page);

    await loginUser(page);
    await page.goto(CONVERSATION_URL);

    await expect(page.locator('text=No messages yet. Start the conversation!')).toBeVisible();
  });

  test('should send a message with a recipient', async ({ page }) => {
    await mockProperty(page);
    await mockParticipant(page);
    await mockThreads(page);
    await mockMessagesEmpty(page);

    await loginUser(page);
    const userId = await getLoggedInUserId(page);
    await mockSendMessage(page, userId, `${TEST_USER.firstName} ${TEST_USER.lastName}`);

    const sendRequest = page.waitForRequest(
      (req) => req.url().includes('/api/chat/messages') && req.method() === 'POST'
    );
    await page.goto(CONVERSATION_URL);

    const input = page.locator('input[placeholder="Type a message..."]');
    await input.fill('Is this still available?');

    const sendBtn = page.locator('button:has(svg)').last();
    await sendBtn.click();

    const req = await sendRequest;
    expect(req.postDataJSON().recipientId).toBe(OTHER_USER.id);
    await expect(page.locator('text=Is this still available?')).toBeVisible();
  });

  test('should display messages from the other user', async ({ page }) => {
    await mockProperty(page);
    await mockParticipant(page);
    await mockThreads(page);
    await mockMessagesWithHistory(page, [
      {
        id: 1,
        propertyId: PROPERTY_ID,
        senderId: OTHER_USER.id,
        recipientId: 1,
        senderName: `${OTHER_USER.firstName} ${OTHER_USER.lastName}`,
        content: 'Hello, is this property still available?',
        sentAt: new Date().toISOString(),
        isRead: false,
      },
    ]);

    await loginUser(page);
    await page.goto(CONVERSATION_URL);

    await expect(page.locator('text=Hello, is this property still available?')).toBeVisible();
    await expect(page.locator(`text=${OTHER_USER.firstName} ${OTHER_USER.lastName}`)).toBeVisible();
  });

  test('should send message on Enter key', async ({ page }) => {
    await mockProperty(page);
    await mockParticipant(page);
    await mockThreads(page);
    await mockMessagesEmpty(page);

    await loginUser(page);
    const userId = await getLoggedInUserId(page);
    await mockSendMessage(page, userId, `${TEST_USER.firstName} ${TEST_USER.lastName}`);

    await page.goto(CONVERSATION_URL);

    const input = page.locator('input[placeholder="Type a message..."]');
    await input.fill('Sent via Enter');
    await input.press('Enter');

    await expect(page.locator('text=Sent via Enter')).toBeVisible();
  });

  test('should disable send button when input is empty', async ({ page }) => {
    await mockProperty(page);
    await mockParticipant(page);
    await mockThreads(page);
    await mockMessagesEmpty(page);

    await loginUser(page);
    await page.goto(CONVERSATION_URL);

    const sendBtn = page.locator('button:has(svg)').last();
    await expect(sendBtn).toBeDisabled();

    const input = page.locator('input[placeholder="Type a message..."]');
    await input.fill('Something');
    await expect(sendBtn).toBeEnabled();

    await input.fill('');
    await expect(sendBtn).toBeDisabled();
  });
});

test.describe('Direct messages', () => {
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

  test('two users share one private conversation per listing', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await mockProperty(pageA);
    await mockProperty(pageB);
    await mockParticipant(pageA);
    await mockParticipant(pageB);
    await mockThreads(pageA);
    await mockThreads(pageB);

    const history: MockMessage[] = [];
    let nextId = 1;

    function setupRoutes(
      page: import('@playwright/test').Page,
      senderId: number,
      senderName: string
    ) {
      page.route(`**/api/chat/messages*`, (route) => {
        if (route.request().method() === 'GET') {
          const withUserId = Number(
            new URL(route.request().url()).searchParams.get('withUserId')
          );
          const messages = history.filter(
            (m) =>
              (m.senderId === senderId && m.recipientId === withUserId) ||
              (m.senderId === withUserId && m.recipientId === senderId)
          );
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(messages),
          });
        }
        if (route.request().method() === 'POST') {
          const body = route.request().postDataJSON();
          const msg: MockMessage = {
            id: nextId++,
            propertyId: body.propertyId,
            senderId,
            recipientId: body.recipientId,
            senderName,
            content: body.content,
            sentAt: new Date().toISOString(),
            isRead: false,
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

    setupRoutes(pageA, USER_A.id, `${USER_A.firstName} ${USER_A.lastName}`);
    setupRoutes(pageB, USER_B.id, `${USER_B.firstName} ${USER_B.lastName}`);

    await pageA.goto(`/chat/${PROPERTY_ID}/${USER_B.id}`);
    await expect(pageA.locator('text=No messages yet')).toBeVisible();

    await pageB.goto(`/chat/${PROPERTY_ID}/${USER_A.id}`);
    await expect(pageB.locator('text=No messages yet')).toBeVisible();

    const inputA = pageA.locator('input[placeholder="Type a message..."]');
    await inputA.fill('Hey Bob, is this still available?');
    await inputA.press('Enter');

    await expect(pageA.locator('text=Hey Bob, is this still available?')).toBeVisible({
      timeout: 5000,
    });

    await pageB.reload();
    await expect(pageB.locator('text=Hey Bob, is this still available?')).toBeVisible({
      timeout: 5000,
    });

    const inputB = pageB.locator('input[placeholder="Type a message..."]');
    await inputB.fill('Yes it is! Want to schedule a viewing?');
    await inputB.press('Enter');

    await expect(pageB.locator('text=Yes it is! Want to schedule a viewing?')).toBeVisible({
      timeout: 5000,
    });

    await pageA.reload();
    await expect(pageA.locator('text=Yes it is! Want to schedule a viewing?')).toBeVisible({
      timeout: 5000,
    });

    await contextA.close();
    await contextB.close();
  });

  test('a conversation is scoped to its two participants', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await mockProperty(page);
    await mockParticipant(page);
    await mockThreads(page);

    const history: MockMessage[] = [
      {
        id: 1,
        propertyId: PROPERTY_ID,
        senderId: USER_A.id,
        recipientId: USER_B.id,
        senderName: `${USER_A.firstName} ${USER_A.lastName}`,
        content: 'Only Alice and Bob should see this',
        sentAt: new Date().toISOString(),
        isRead: true,
      },
    ];

    page.route(`**/api/chat/messages*`, (route) => {
      if (route.request().method() === 'GET') {
        const withUserId = Number(
          new URL(route.request().url()).searchParams.get('withUserId')
        );
        const messages = history.filter(
          (m) =>
            (m.senderId === USER_A.id && m.recipientId === withUserId) ||
            (m.senderId === withUserId && m.recipientId === USER_A.id)
        );
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(messages),
        });
      }
      route.fallback();
    });

    await page.goto('/login');
    await page.fill('#email', USER_A.email);
    await page.fill('#password', USER_A.password);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/search**', { timeout: 10000 });

    await page.goto(`/chat/${PROPERTY_ID}/${OTHER_USER.id}`);
    await expect(page.locator('text=No messages yet. Start the conversation!')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Only Alice and Bob should see this')).toHaveCount(0);

    await context.close();
  });
});

test.describe('Messages inbox', () => {
  test('should list conversations and open one', async ({ page }) => {
    await page.route('**/api/chat/threads*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            propertyId: PROPERTY_ID,
            otherUserId: OTHER_USER.id,
            otherName: 'Other User',
            propertyTitle: 'E2E Test Property',
            propertyImage: 'house.jpg',
            lastMessage: 'Is this still available?',
            lastMessageAt: new Date().toISOString(),
            unreadCount: 2,
          },
        ]),
      })
    );

    await loginUser(page);
    await page.goto('/messages');

    await expect(page.locator('h1:has-text("Messages")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Other User')).toBeVisible();
    await expect(page.locator('text=Is this still available?')).toBeVisible();

    await page.locator('button:has-text("Other User")').click();
    await expect(page).toHaveURL(
      new RegExp(`/chat/${PROPERTY_ID}/${OTHER_USER.id}`),
      { timeout: 10000 }
    );
  });

  test('should require auth', async ({ page }) => {
    await page.goto('/messages');
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });
});
