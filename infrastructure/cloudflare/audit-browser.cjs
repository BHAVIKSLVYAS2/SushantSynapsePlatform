const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { once } = require('node:events');
const { chromium } = require('playwright');

const dist = path.resolve(__dirname, 'dist');
const output = path.resolve(__dirname, '../../output/playwright/runtime-audit');
const routes = ['/', '/ritual-assist', '/rashifal-kundli', '/rashifal-kundli/rashifal', '/japseva', '/moment-studio', '/tournament-lite', '/batchfee-lite'];
const mime = { html: 'text/html', css: 'text/css', js: 'text/javascript', mjs: 'text/javascript', json: 'application/json', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', woff2: 'font/woff2' };
const sheets = new Map();

function observe() {
  window.vitals = { lcp: null, cls: 0, interactions: {} };
  let first = -Infinity, previous = -Infinity, shift = 0;
  function watch(type, collect, options) {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) return;
    new PerformanceObserver(list => list.getEntries().forEach(collect)).observe({ type, buffered: true, ...options });
  }
  watch('largest-contentful-paint', entry => { window.vitals.lcp = entry.startTime; });
  watch('layout-shift', entry => {
    if (entry.hadRecentInput) return;
    if (entry.startTime - first >= 5000 || entry.startTime - previous >= 1000) {
      first = entry.startTime;
      shift = 0;
    }
    previous = entry.startTime;
    shift += entry.value;
    window.vitals.cls = Math.max(shift, window.vitals.cls);
  });
  watch('event', entry => {
    if (!entry.interactionId) return;
    const timings = window.vitals.interactions;
    timings[entry.interactionId] = Math.max(timings[entry.interactionId] || 0, entry.duration);
  }, { durationThreshold: 16 });
}

async function exercise(page) {
  const states = [];
  async function click(selector) {
    const target = page.locator(selector + ':visible').first();
    if (!await target.count()) return false;
    await target.click({ timeout: 4000 });
    states.push(selector);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    return true;
  }
  if (await click('#synapse-beta-dialog[open] input')) await click('[data-beta-continue]');
  if (await click('[data-theme-toggle]')) await click('[data-theme-close]');
  if (await click('.platform-switch')) {
    await page.locator('.platform-switcher-search input').fill('coverage-no-results');
    await click('[data-clear-app-search]');
    await page.keyboard.press('Escape');
  }
  if (await click('.home-view-switch summary') && await click('.home-layout-edit')) {
    await click('[data-layout-action=pin]');
    await click('.home-layout-done');
  }
  if (await click('.home-filter-menu summary')) await click('[data-tool-filter=games]');
  const search = page.locator('.home-discovery-toolbar input:visible').first();
  if (await search.count()) {
    await search.fill('coverage-no-results');
    await page.locator('.home-search-empty').waitFor({ state: 'visible' });
    await search.fill('');
    states.push('empty search and reset');
  }
  await click('.rashifal-preview-info summary');
  return states;
}

async function profile(browser, origin, route, width, theme) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: width === 320 ? 'reduce' : 'no-preference', serviceWorkers: 'block' });
  try {
    await context.route(/^https?:/, route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    await context.addInitScript(theme => localStorage.setItem('synapse-theme', theme), theme);
    await context.addInitScript(observe);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const headers = new Map();
    cdp.on('CSS.styleSheetAdded', ({ header }) => headers.set(header.styleSheetId, header));
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    await cdp.send('CSS.startRuleUsageTracking');
    const events = [];
    const trace = theme === 'light';
    if (trace) {
      cdp.on('Tracing.dataCollected', ({ value }) => events.push(...value));
      await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8,disabled-by-default-v8.compile' });
    }
    const response = await page.goto(origin + route);
    if (!response?.ok()) throw Error('Could not load ' + route);
    await page.locator('.vedic-initial-loading').waitFor({ state: 'hidden' });
    await page.evaluate(() => document.fonts.ready);
    const states = await exercise(page);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const metrics = await page.evaluate(() => ({
      ...window.vitals,
      renderedTheme: document.documentElement.dataset.theme,
      renderedThemeStyle: document.documentElement.dataset.themeStyle,
      navigation: performance.getEntriesByType('navigation')[0].toJSON(),
      resources: performance.getEntriesByType('resource').filter(entry => entry.name.startsWith(location.origin + '/')).map(({ name, initiatorType, decodedBodySize, transferSize }) => ({ path: new URL(name).pathname, initiatorType, decodedBodySize, transferSize }))
    }));
    const { ruleUsage } = await cdp.send('CSS.stopRuleUsageTracking');
    for (const [id, header] of headers) {
      if (header.isInline || !header.sourceURL.startsWith(origin + '/')) continue;
      const asset = new URL(header.sourceURL).pathname;
      if (!sheets.has(asset)) {
        const { text } = await cdp.send('CSS.getStyleSheetText', { styleSheetId: id });
        sheets.set(asset, { text, routes: new Set(), ranges: new Map() });
      }
      const sheet = sheets.get(asset);
      sheet.routes.add(route);
      for (const rule of ruleUsage) {
        if (rule.used && rule.styleSheetId === id) sheet.ranges.set(rule.startOffset, rule.endOffset);
      }
    }
    if (trace) {
      const complete = once(cdp, 'Tracing.tracingComplete');
      await cdp.send('Tracing.end');
      await complete;
    }
    const traceCpu = {};
    for (const { name, ph, dur } of events) {
      if (ph === 'X' && /parse|compile/i.test(name)) traceCpu[name] = (traceCpu[name] || 0) + dur / 1000;
    }
    let followLink;
    if (route === '/' && trace) {
      const destination = { 320: '/ritual-assist', 768: '/rashifal-kundli', 1440: '/japseva' }[width];
      await page.locator('.platform-switch:visible').click();
      const link = page.locator('#platform-switcher a[href="' + destination + '"]');
      const started = Date.now();
      await Promise.all([page.waitForURL(origin + destination, { waitUntil: 'load' }), link.click()]);
      followLink = { destination, clickToLoadMs: Date.now() - started, navigation: await page.evaluate(() => performance.getEntriesByType('navigation')[0].toJSON()) };
    }
    return { route, width, theme, states, ...metrics, traceCpu, followLink };
  } finally {
    await context.close();
  }
}

function coverage() {
  return [...sheets].map(([asset, { text, routes, ranges }]) => {
    const usedSelectors = new Set([...ranges.keys()].map(start => text.slice(start, text.indexOf('{', start)).trim()));
    const candidates = new Set();
    const lines = text.split('\n');
    require('lightningcss').transform({ filename: 'audit.css', code: Buffer.from(text), visitor: {
      Rule(rule) {
        if (rule.type !== 'style') return;
        const { line, column } = rule.value.loc;
        const start = lines.slice(0, line).reduce((sum, part) => sum + part.length + 1, 0) + column - 1;
        const selector = text.slice(start, text.indexOf('{', start)).trim();
        if (selector && !usedSelectors.has(selector)) candidates.add(selector);
      }
    } });
    let used = 0, end = 0;
    for (const [start, nextEnd] of [...ranges].sort((a, b) => a[0] - b[0])) {
      used += Math.max(0, nextEnd - Math.max(start, end));
      end = Math.max(end, nextEnd);
    }
    return { asset, routes: [...routes], codeUnits: text.length, matchedCodeUnits: used, matchedRules: ranges.size, candidates: [...candidates] };
  });
}

async function main() {
  const homeOnly = process.argv.includes('--home-only');
  const selectedRoutes = homeOnly ? ['/'] : routes;
  const pages = JSON.parse(await fs.readFile(path.join(dist, '../pages.json')));
  for (const route of selectedRoutes) if (!pages[route]) throw Error('Missing built route ' + route);
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost').pathname;
      const file = path.resolve(dist, '.' + (pages[url] || url));
      if (!file.startsWith(dist + path.sep)) throw Error('Invalid path');
      const body = await fs.readFile(file);
      response.writeHead(200, { 'content-type': mime[path.extname(file).slice(1)] || 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
    const origin = 'http://127.0.0.1:' + server.address().port;
    const samples = [];
    for (const route of selectedRoutes) {
      for (const width of [320, 768, 1440]) {
        for (const theme of ['light', 'dark', 'deep']) {
          samples.push(await profile(browser, origin, route, width, theme));
        }
      }
      console.log('Captured ' + route);
    }
    await fs.mkdir(output, { recursive: true });
    const report = homeOnly ? 'home.json' : 'report.json';
    await fs.writeFile(path.join(output, report), JSON.stringify({ chrome: browser.version(), samples, css: coverage() }, null, 2) + '\n');
  } finally {
    await browser?.close();
    server.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
