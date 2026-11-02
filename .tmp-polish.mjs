import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
// Headless Chromium defaults to `prefers-reduced-transparency: reduce`, which
// swaps every glass surface for an opaque one. Real phones usually report
// `no-preference`, so emulate that for an honest visual audit.
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-transparency', value: 'no-preference' }],
});
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

const wait = (ms) => page.waitForTimeout(ms);
const shot = (name) => page.screenshot({ path: `docs/ui-audit/polish-${name}.png` });

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem(
    'phone-os:tutorial',
    JSON.stringify({
      state: {
        introSeen: true,
        setupDone: true,
        active: true,
        stepIndex: 0,
        done: [],
        openedApps: [],
        deviceName: '테스트의 iPhone',
        defaultIdentity: 'alias',
        notifications: true,
        sound: true,
      },
      version: 1,
    }),
  );
});
await page.reload({ waitUntil: 'networkidle' });
await wait(900);

await shot('01-lock-light');
await page.getByText('위로 밀어 잠금 해제').click();
await wait(1100);
await shot('02-home-light');

await page.getByRole('button', { name: '가이드 펼치기' }).click();
await wait(650);
await shot('03-guide-light');
await page.getByRole('button', { name: '가이드 접기' }).click();
await wait(400);

await page.getByRole('button', { name: '설정', exact: true }).first().click();
await wait(1000);
await shot('04-settings-light');
await page.getByRole('button', { name: '홈으로' }).click();
await wait(700);

// control centre (top-right pull)
await page.mouse.move(400, 18);
await page.mouse.down();
await page.mouse.move(400, 340, { steps: 14 });
await page.mouse.up();
await wait(700);
await shot('05-control-light');
await page.getByRole('button', { name: '홈으로' }).click();
await wait(600);

// notification centre (top-left pull)
await page.mouse.move(40, 18);
await page.mouse.down();
await page.mouse.move(40, 340, { steps: 14 });
await page.mouse.up();
await wait(700);
await shot('06-notifications-light');
await page.getByRole('button', { name: '홈으로' }).click();
await wait(600);

await page.emulateMedia({ colorScheme: 'dark' });
await wait(900);
await shot('07-home-dark');

// control centre in dark mode
await page.mouse.move(400, 18);
await page.mouse.down();
await page.mouse.move(400, 340, { steps: 14 });
await page.mouse.up();
await wait(700);
await shot('08-control-dark');
await page.getByRole('button', { name: '홈으로' }).click();
await wait(600);
await page.getByRole('button', { name: '가이드 펼치기' }).click();
await wait(650);
await shot('09-guide-dark');
await page.getByRole('button', { name: '가이드 접기' }).click();
await wait(400);

await page.getByRole('button', { name: '설정', exact: true }).first().click();
await wait(1000);
await shot('10-settings-dark');
await page.getByRole('button', { name: '홈으로' }).click();
await wait(700);

await page.getByLabel('초선일보').click();
await wait(1000);
await shot('11-news-dark');

// app switcher: long, fast swipe up from the bottom edge
await page.mouse.move(215, 900);
await page.mouse.down();
await page.mouse.move(215, 600, { steps: 6 });
await page.mouse.up();
await wait(800);
await shot('12-switcher-dark');

const perf = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  return {
    domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
    load: Math.round(nav.loadEventEnd),
    resources: performance.getEntriesByType('resource').length,
  };
});

console.log(JSON.stringify({ errors, perf }, null, 2));
await browser.close();
