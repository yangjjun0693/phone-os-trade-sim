import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
const wait = (ms) => page.waitForTimeout(ms);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await wait(1300);
await page.getByText('위로 밀어 잠금 해제').click();
await wait(800);

const windows = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-app-window]')].map((w) => ({
      app: w.getAttribute('data-app-window'),
      op: Number(getComputedStyle(w).opacity).toFixed(2),
      pe: getComputedStyle(w).pointerEvents,
      hidden: w.getAttribute('aria-hidden'),
    })),
  );

const switcherOpen = () => page.evaluate(() => document.querySelectorAll('button[aria-label$="열기"]').length);

const tapProbe = () =>
  page.evaluate(() => {
    const win = [...document.querySelectorAll('[data-app-window]')].pop();
    if (!win) return { error: 'no window' };
    const btns = [...win.querySelectorAll('button')].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 24 && r.height > 24 && r.top > 90 && r.bottom < innerHeight - 30;
    });
    if (!btns.length) return { error: 'no button' };
    const b = btns[0];
    const r = b.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      label: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 18),
      ok: !!top && (top === b || b.contains(top)),
    };
  });

async function swipeUp() {
  await page.mouse.move(215, 880);
  await page.mouse.down();
  for (let i = 1; i <= 7; i += 1) await page.mouse.move(215, 880 - (320 / 7) * i);
  await page.mouse.up();
  await wait(650);
}

async function ensureHome() {
  for (let i = 0; i < 4; i += 1) {
    if (await switcherOpen()) {
      await page.mouse.click(215, 760);
      await wait(450);
      continue;
    }
    if ((await windows()).length === 0) return;
    await page.getByRole('button', { name: '홈으로' }).click().catch(() => {});
    await wait(450);
  }
}

// 1. an app that is animating out is inert
await page.getByRole('button', { name: '설정', exact: true }).first().click();
await wait(700);
await page.getByRole('button', { name: '홈으로' }).click();
await wait(40);
console.log('1. exiting window', JSON.stringify(await windows()));
await wait(400);

// 2. switcher is a layer over the running app; dismissing returns to it
await page.getByRole('button', { name: '설정', exact: true }).first().click();
await wait(600);
await swipeUp();
console.log('2. switcher', (await switcherOpen()) > 0, 'behind', JSON.stringify(await windows()));
await page.mouse.click(215, 760);
await wait(500);
console.log('2. after dismiss', (await switcherOpen()) > 0, JSON.stringify(await windows()), await tapProbe());

// 3. reopen the same app from the switcher repeatedly
let failures = 0;
for (let i = 0; i < 20; i += 1) {
  await swipeUp();
  const card = page.locator('button[aria-label="설정 열기"]').first();
  if ((await card.count()) === 0) {
    console.log(`3. round ${i}: no card (switcher=${await switcherOpen()})`, JSON.stringify(await windows()));
    failures += 1;
    break;
  }
  await card.click({ noWaitAfter: true, timeout: 1500 }).catch(() => {});
  await wait(600);
  const w = await windows();
  const probe = await tapProbe();
  const ok = w.length === 1 && w[0].op === '1.00' && w[0].pe === 'auto' && probe.ok === true;
  if (!ok) {
    failures += 1;
    console.log(`3. round ${i} BAD`, JSON.stringify(w), probe);
    break;
  }
}
console.log('3. reopen failures', failures);

// 4. a real row tap changes the screen
await ensureHome();
await page.getByRole('button', { name: '설정', exact: true }).first().click();
await wait(700);
const before = await page.evaluate(() => document.body.innerText.length);
const row = page.locator('[data-app-window] button').filter({ hasText: '알림' }).first();
const rowCount = await row.count();
if (rowCount) {
  await row.click({ timeout: 2000 }).catch((e) => console.log('4. row click fail', String(e).slice(0, 90)));
  await wait(400);
}
const after = await page.evaluate(() => document.body.innerText.length);
console.log('4. row count', rowCount, 'length', before, '->', after);

// 5. quit the running app's card
await ensureHome();
await page.getByRole('button', { name: '설정', exact: true }).first().click();
await wait(600);
await swipeUp();
const card = page.locator('button[aria-label="설정 열기"]').first();
if (await card.count()) {
  // swipe the card up to quit it
  const box = await card.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 120, { steps: 8 });
    await page.mouse.up();
    await wait(500);
  }
}
console.log('5. after quit card: cards', await switcherOpen(), 'windows', JSON.stringify(await windows()));
await ensureHome();
console.log('5. home windows', JSON.stringify(await windows()));

console.log('errors', errors.slice(0, 3));
await browser.close();
