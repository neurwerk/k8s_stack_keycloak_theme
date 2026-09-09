import { createHmac, randomUUID } from 'node:crypto';
import { test as base, expect } from '@playwright/test';

// Deliberately not configurable: these credentials and mutations are local preview only.
const origin = 'http://localhost:8080';
const realm = `${origin}/realms/neurwerk`;
const mailpit = 'http://localhost:8025';
const password = 'Preview-only-123!';
const test = base.extend({
  user: async ({ request }, use) => {
    const tokenResponse = await request.post(`${origin}/realms/master/protocol/openid-connect/token`, {
      form: { grant_type: 'password', client_id: 'admin-cli', username: 'preview-admin', password: 'Disposable-preview-admin-123!' },
    });
    expect(tokenResponse.ok(), 'Local disposable preview admin must be available').toBeTruthy();
    const { access_token: token } = await tokenResponse.json();
    const headers = { Authorization: `Bearer ${token}` };
    const username = `theme-test-${randomUUID()}`;
    const user = { username, email: `${username}@example.test`, password };
    const created = await request.post(`${origin}/admin/realms/neurwerk/users`, {
      headers,
      data: { username, email: user.email, firstName: 'Theme', lastName: 'Test', enabled: true, emailVerified: true,
        credentials: [{ type: 'password', value: password, temporary: false }] },
    });
    expect(created.status()).toBe(201);
    const location = new URL(created.headers().location);
    expect(location.origin).toBe(origin);
    expect(location.pathname).toMatch(/^\/admin\/realms\/neurwerk\/users\/[^/]+$/);
    user.setRequiredActions = async (requiredActions) => {
      const response = await request.put(location.href, {
        headers, data: { requiredActions, ...(requiredActions.includes('VERIFY_EMAIL') ? { emailVerified: false } : {}) },
      });
      expect(response.status()).toBe(204);
    };
    user.getProfile = async () => {
      const response = await request.get(location.href, { headers });
      expect(response.ok()).toBeTruthy();
      return response.json();
    };
    try {
      await use(user);
    } finally {
      const deleted = await request.delete(location.href, { headers });
      expect(deleted.status(), 'Clean up only this test user').toBe(204);
    }
  },
});

async function openLogin(page) {
  const state = randomUUID();
  const params = new URLSearchParams({ client_id: 'theme-preview', redirect_uri: `${origin}/callback`, response_type: 'code', scope: 'openid', state, kc_locale: 'en', prompt: 'login' });
  await page.goto(`${realm}/protocol/openid-connect/auth?${params}`);
  await expect(page.locator('#kc-form-login')).toBeVisible();
  return state;
}

async function login(page, user, value = user.password) {
  await page.locator('#username').fill(user.username);
  await page.locator('#password').fill(value);
  await page.locator('#kc-login').click();
}

async function expectCode(page, state) {
  await expect(page).toHaveURL((url) => url.origin === origin && url.pathname === '/callback' && Boolean(url.searchParams.get('code')));
  expect(new URL(page.url()).searchParams.get('state')).toBe(state);
}

async function readEmail(request, user) {
  let message;
  await expect.poll(async () => {
    const response = await request.get(`${mailpit}/api/v1/search`, { params: { query: `to:${user.email}` } });
    expect(response.ok()).toBeTruthy();
    message = (await response.json()).messages?.[0];
    return Boolean(message);
  }, { timeout: 20_000, message: 'Email delivered to this isolated user' }).toBe(true);
  const response = await request.get(`${mailpit}/api/v1/message/${message.ID}`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}

function totp(secret, algorithm, digits, period) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...secret.replace(/\s|=/g, '').toUpperCase()].map((char) => {
    const value = alphabet.indexOf(char);
    expect(value).toBeGreaterThanOrEqual(0);
    return value.toString(2).padStart(5, '0');
  }).join('');
  const key = Buffer.from(bits.match(/.{8}/g).map((byte) => parseInt(byte, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 1000 / period)));
  const digest = createHmac(algorithm, key).update(counter).digest();
  const offset = digest.at(-1) & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits).toString().padStart(digits, '0');
}

test('native login layout and password visibility', async ({ page }, testInfo) => {
  await openLogin(page);
  await expect(page.locator('#kc-header-wrapper')).toContainText(/neurwerk/i);
  await expect(page.locator('#kc-login')).toHaveCSS('background-color', 'rgb(85, 99, 171)');
  const panel = await page.locator('.pf-v5-c-login__main').boundingBox();
  expect(panel.width).toBeGreaterThanOrEqual(Math.min(460, page.viewportSize().width - 32));
  for (const id of ['username', 'password']) {
    const radius = await page.locator(`#${id}`).evaluate((input) => {
      // PatternFly puts the visible border on the input's wrapper.
      const wrapper = input.closest('.pf-v5-c-form-control, .pf-v6-c-form-control');
      return Math.max(parseFloat(getComputedStyle(input).borderTopLeftRadius), wrapper ? parseFloat(getComputedStyle(wrapper).borderTopLeftRadius) : 0);
    });
    expect(radius, `${id} has rounded corners`).toBeGreaterThanOrEqual(8);
  }
  await page.locator('#password').fill(password);
  const show = page.getByRole('button', { name: 'Show password', exact: true });
  await expect(show).toBeVisible();
  expect(await show.evaluate((button) => getComputedStyle(button, '::after').content)).toBe('"Show password"');
  await expect(show.locator('i')).toBeHidden();
  await show.click();
  await expect(page.locator('#password')).toHaveAttribute('type', 'text');
  const hide = page.getByRole('button', { name: 'Hide password', exact: true });
  expect(await hide.evaluate((button) => getComputedStyle(button, '::after').content)).toBe('"Hide password"');
  await hide.click();
  await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  await expect(page.locator('#password')).toHaveValue(password);
  await page.locator('#password').clear();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('login.png'), fullPage: true });
});

test('invalid login keeps the password field usable, valid login returns an authorization code', async ({ page, user }) => {
  const state = await openLogin(page);
  await login(page, user, 'Definitely-wrong-123!');
  await expect(page.getByText('Invalid username or password.', { exact: true })).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('#kc-login')).toBeEnabled();
  await login(page, user);
  await expectCode(page, state);
});

test('reset email preserves HTML and text action links and changes the password', async ({ page, request, user, context }) => {
  await openLogin(page);
  await page.getByRole('link', { name: 'Forgot Password?', exact: true }).click();
  await page.locator('#username').fill(user.username);
  await page.locator('form').locator('[type=submit]').click();
  const email = await readEmail(request, user);
  expect(email.HTML.replace(/<[^>]*>/g, '')).toMatch(/neurwerk/i);
  expect(email.HTML).toMatch(/<table\b/i);
  expect(email.Text).toMatch(/reset/i);
  const links = await page.evaluate((html) => [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('a[href]')].map((a) => a.href), email.HTML);
  const action = links.find((href) => new URL(href).pathname === '/realms/neurwerk/login-actions/action-token');
  expect(action, 'Upstream reset action link is present').toBeTruthy();
  expect(new URL(action).origin).toBe(origin);
  expect(email.Text).toContain(action);
  await page.goto(action);
  const changed = 'Changed-preview-only-456!';
  await page.locator('#password-new').fill(changed);
  await page.locator('#password-confirm').fill(changed);
  await page.locator('#kc-passwd-update-form [type=submit]').click();
  await expect(page.locator('#password-new')).toHaveCount(0);
  // Discard SSO cookies so success proves password authentication, not a session reuse.
  await context.clearCookies();
  const state = await openLogin(page);
  await login(page, user, password);
  await expect(page.getByText('Invalid username or password.', { exact: true })).toBeVisible();
  await login(page, user, changed);
  await expectCode(page, state);
});

test('required email verification preserves both email parts and completes the action', async ({ page, request, user, context }, testInfo) => {
  await user.setRequiredActions(['VERIFY_EMAIL']);
  const state = await openLogin(page);
  await login(page, user);
  await expect(page.locator('body')).toHaveAttribute('data-page-id', 'login-login-verify-email');
  await expect(page.locator('#kc-header-wrapper')).toContainText(/neurwerk/i);
  await page.screenshot({ path: testInfo.outputPath('verify-email.png'), fullPage: true });
  const email = await readEmail(request, user);
  expect(email.HTML.replace(/<[^>]*>/g, '')).toMatch(/neurwerk/i);
  expect(email.HTML).toMatch(/<table\b/i);
  expect(email.Text).toMatch(/verif/i);
  const preview = await context.newPage();
  // Render the actual email, but never fetch images, fonts, scripts or other remote resources.
  await preview.route('**/*', (route) => route.abort());
  await preview.setContent(email.HTML);
  const links = await preview.locator('a[href]').evaluateAll((anchors) => anchors.map((a) => a.href));
  const action = links.find((href) => new URL(href).pathname === '/realms/neurwerk/login-actions/action-token');
  expect(action).toBeTruthy();
  expect(new URL(action).origin).toBe(origin);
  expect(email.Text).toContain(action);
  await preview.screenshot({ path: testInfo.outputPath('verification-email-html.png'), fullPage: true });
  await preview.close();
  await page.goto(action);
  await expectCode(page, state);
  const profile = await user.getProfile();
  expect(profile.emailVerified).toBe(true);
  expect(profile.requiredActions).not.toContain('VERIFY_EMAIL');
  await context.clearCookies();
  const nextState = await openLogin(page);
  await login(page, user);
  await expectCode(page, nextState);
});

test('required OTP enrollment and subsequent password plus OTP login', async ({ page, user, context }, testInfo) => {
  test.setTimeout(90_000);
  await user.setRequiredActions(['CONFIGURE_TOTP']);
  const state = await openLogin(page);
  await login(page, user);
  await expect(page.locator('#kc-totp-settings-form')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('otp-enrollment.png'), fullPage: true });
  await page.locator('#mode-manual').click();
  const secret = await page.locator('#kc-totp-secret-key').innerText();
  const algorithm = (await page.locator('#kc-totp-algorithm').innerText()).split(':').at(-1).trim().replace('-', '').toLowerCase();
  const digits = Number((await page.locator('#kc-totp-digits').innerText()).split(':').at(-1).trim());
  const period = Number((await page.locator('#kc-totp-period').innerText()).split(':').at(-1).trim());
  expect(['sha1', 'sha256', 'sha512']).toContain(algorithm);
  expect([6, 8]).toContain(digits);
  expect(period).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath('otp-manual.png'), fullPage: true });
  await page.locator('#userLabel').fill('Disposable browser test');
  const enrollmentStep = Math.floor(Date.now() / 1000 / period);
  await page.locator('#totp').fill(totp(secret, algorithm, digits, period));
  await page.locator('#saveTOTPBtn').click();
  await expectCode(page, state);
  expect((await user.getProfile()).requiredActions).not.toContain('CONFIGURE_TOTP');
  await context.clearCookies();
  const nextState = await openLogin(page);
  await login(page, user);
  await expect(page.locator('#kc-otp-login-form')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('otp-login.png'), fullPage: true });
  // Use a fresh time step rather than relying on the realm permitting OTP replay.
  await expect.poll(() => Math.floor(Date.now() / 1000 / period), { timeout: (period + 2) * 1000 }).toBeGreaterThan(enrollmentStep);
  await page.locator('#otp').fill(totp(secret, algorithm, digits, period));
  await page.locator('#kc-login').click();
  await expectCode(page, nextState);
});

test('keyboard-only login reaches native controls and authenticates', async ({ page, user }) => {
  const state = await openLogin(page);
  await expect(page.locator('#username')).toBeFocused();
  await page.keyboard.type(user.username);
  await page.keyboard.press('Tab');
  await expect(page.locator('#password')).toBeFocused();
  await page.keyboard.type(user.password);
  await page.keyboard.press('Tab');
  await expect(page.locator('#password-show-password')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('#password')).toHaveAttribute('type', 'text');
  await page.keyboard.press('Space');
  await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Forgot Password?', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#kc-login')).toBeFocused();
  await page.keyboard.press('Enter');
  await expectCode(page, state);
});

test('English German and Dutch login render localized native controls without overflow', async ({ page }, testInfo) => {
  const labels = new Set();
  await openLogin(page);
  for (const locale of ['en', 'de', 'nl']) {
    const option = await page.locator('#login-select-toggle option').evaluateAll((options, language) =>
      options.find((entry) => new URL(entry.value, document.baseURI).searchParams.get('kc_locale') === language)?.value, locale);
    expect(option, `Native language selector offers ${locale}`).toBeTruthy();
    await page.locator('#login-select-toggle').selectOption(option);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('#kc-header-wrapper')).toContainText(/neurwerk/i);
    const toggle = page.locator('#password-show-password');
    const show = await toggle.getAttribute('aria-label');
    expect(show).toBeTruthy();
    labels.add(show);
    expect(await toggle.evaluate((button) => getComputedStyle(button, '::after').content)).toBe(JSON.stringify(show));
    await toggle.click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');
    await expect(toggle).not.toHaveAttribute('aria-label', show);
    await toggle.click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`login-${locale}.png`), fullPage: true });
  }
  expect(labels.size, 'All three upstream password-toggle translations are distinct').toBe(3);
});
