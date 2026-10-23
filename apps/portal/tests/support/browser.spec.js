const {test, expect} = require('../../../../tests/browser-fixture.js');
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let child, base, dir;

test.beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'synapse-support-'));
  child = spawn(process.execPath, ['server/index.js'], {
    env: {...process.env, PORT: '0', DATA_DIR: dir},
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(Error('Startup timed out')), 15000);
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/localhost:(\d+)/);
      if (match) {
        base = 'http://127.0.0.1:' + match[1];
        clearTimeout(timer);
        resolve();
      }
    });
    child.once('error', reject);
  });
});

test.afterAll(async () => {
  if (child?.exitCode === null) {
    await new Promise(resolve => {
      child.once('exit', resolve);
      child.kill();
    });
  }
  if (dir) fs.rmSync(dir, {recursive: true, force: true});
});

test('support choices, owner settings, payment links and disabling', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {value: undefined}));
  await page.goto(base + '/support');
  await expect(page.getByRole('heading', {name: 'Help us keep good tools free'})).toBeVisible();
  await expect(page.locator('.support-promises')).toContainText('One-time only');
  await expect(page.locator('#availability')).toContainText('not available yet');
  await expect(page.locator('#payment')).toBeHidden();
  await expect(page.locator('.treat')).toHaveCount(4);
  await expect(page.locator('.treat small').first()).toContainText('A small sip of encouragement');
  await expect(page.locator('.support-contact')).not.toHaveAttribute('open', '');
  await expect(page.locator('#share')).toContainText('Share a tool');
  await expect(page.locator('#share')).toContainText('Contact us');
  await page.getByRole('link', {name: 'Choose a one-time amount'}).click();
  await expect(page).toHaveURL(/\/support#contribute$/);
  await page.getByRole('button', {name: 'Pani puri · ₹99', exact: true}).click();
  await expect(page.locator('[data-amount="99"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#payment')).toBeHidden();
  await page.screenshot({path: '.publish/support-simple-desktop.png', fullPage: true});

  expect((await page.request.post(base + '/api/auth/setup', {
    data: {name: 'Owner', email: 'support@example.com', firmName: 'Test', password: 'Support browser password 2026!'}
  })).status()).toBe(201);
  await page.reload();
  await expect(page.locator('#owner-panel')).toBeVisible();
  await page.locator('#owner-panel summary').click();
  await page.locator('[name=title]').fill('Test Recipient');
  await page.locator('[name=upiId]').fill('test@bank');
  await page.locator('[name=isActive]').check();
  await page.getByRole('button', {name: 'Save support settings'}).click();
  await expect(page.locator('#owner-status')).toContainText('saved');
  await expect(page.locator('#qr')).toBeVisible();

  for (const amount of [20, 49, 99, 249]) {
    await page.locator('[data-amount="' + amount + '"]').click();
    await expect(page.locator('#amount')).toHaveText('₹' + amount);
    await expect(page.locator('#qr')).toBeVisible();
    const target = await page.locator('#pay').getAttribute('href');
    expect(new URL(target).searchParams.get('am')).toBe(String(amount));
    const decoded = await page.evaluate(async () => {
      if (!window.BarcodeDetector) return null;
      const bitmap = await createImageBitmap(document.querySelector('#qr'));
      return (await new BarcodeDetector({formats: ['qr_code']}).detect(bitmap))[0]?.rawValue;
    });
    if (decoded !== null) expect(decoded).toBe(target);
  }
  await page.locator('#copy').click();
  await expect(page.locator('#copy-value')).toHaveValue('test@bank');
  await expect(page.locator('#copy-value')).toBeFocused();
  await page.locator('[name=upiId]').fill('');
  await page.locator('[name=paymentUrl]').fill('https://example.com/support');
  await page.getByRole('button', {name: 'Save support settings'}).click();
  await expect(page.locator('#pay')).toHaveAttribute('href', 'https://example.com/support');
  await expect(page.locator('#treats')).toBeHidden();
  await expect(page.locator('#amount')).toHaveText('Choose an amount at checkout');
  await expect(page.locator('#qr')).toBeVisible();
  await page.locator('[name=isActive]').uncheck();
  await page.getByRole('button', {name: 'Save support settings'}).click();
  await expect(page.locator('#payment')).toBeHidden();
  await expect(page.locator('#availability')).toContainText('not available yet');
  expect(errors).toEqual([]);
});

test('mobile themes, outage honesty and homepage discovery', async ({page, browser}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.route('**/api/support', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({title: 'Test Recipient', upiId: 'test@bank', paymentUrl: '', isActive: true})
  }));
  await page.goto(base + '/support');
  await expect(page.locator('#qr')).toBeVisible();
  for (const theme of ['dark', 'light']) {
    await page.getByRole('button', {name: 'Dark mode', exact: true}).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.screenshot({path: 'test-results/support-mobile-' + theme + '.png', fullPage: true});
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({path: 'test-results/support-desktop-light.png', fullPage: true});
  await page.unroute('**/api/support');
  await page.route('**/api/support', route => route.abort());
  await page.reload();
  await expect(page.locator('#availability')).toContainText('temporarily unavailable');
  await expect(page.locator('#payment')).toBeHidden();
  await page.goto(base + '/');
  await page.getByRole('link', {name: 'Support us', exact: true}).first().click();
  await expect(page).toHaveURL(/\/support/);

  const context = await require('../../../../tests/browser-fixture.js').acknowledgedContext(browser, {javaScriptEnabled: false});
  try {
    const nojs = await context.newPage();
    await nojs.goto(base + '/');
    await nojs.getByRole('link', {name: 'Support us', exact: true}).first().click();
    await expect(nojs.locator('noscript p').filter({hasText: 'Enable JavaScript'})).toContainText('Enable JavaScript');
    await expect(nojs.getByRole('navigation', {name: 'Support and contact'}).getByRole('link', {name: 'Contact'})).toBeVisible();
  } finally {
    await context.close();
  }
});
