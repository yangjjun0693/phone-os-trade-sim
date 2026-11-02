import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 430, height: 931 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await wait(1200);
await page.getByText('위로 밀어 잠금 해제').tap();
await wait(900);

const layers = () =>
  page.evaluate(() => {
    const stack = document.elementsFromPoint(215, 420).slice(0, 6);
    return stack.map((el) => ({
      tag: el.tagName,
      cls: String(el.className).slice(0, 60),
      pe: getComputedStyle(el).pointerEvents,
      text: (el.textContent || '').trim().slice(0, 20),
    }));
  });

const windows = () => page.evaluate(() => document.querySelectorAll('div.absolute.inset-0.z-30').length);
const switchers = () => page.evaluate(() => document.querySelectorAll('button[aria-label$="열기"]').length);

await page.getByRole('button', { name: '설정', exact: true }).first().tap();
await wait(900);
console.log('opened settings, windows', await windows());

for (let i = 0; i < 6; i += 1) {
  // open switcher
  await page.mouse.move(215, 880);
  await page.mouse.down();
  for (let k = 1; k <= 8; k += 1) await page.mouse.move(215, 880 - (330 / 8) * k);
  await page.mouse.up();
  await wait(700);
  console.log(`cycle ${i} switcher`, await switchers(), 'windows', await windows());

  const card = page.locator('button[aria-label="설정 열기"]').first();
  if ((await card.count()) === 0) {
    console.log('no card; layers', JSON.stringify(await layers()));
    break;
  }
  await card.tap();
  await wait(60);
  console.log(`cycle ${i} +60ms windows`, await windows(), JSON.stringify(await layers()));
  await wait(340);
  console.log(`cycle ${i} +400ms windows`, await windows(), JSON.stringify(await layers()));

  // Try a real interaction: tap the first settings row.
  const row = page.locator('div.absolute.inset-0.z-30 button').filter({ hasText: '알림' }).first();
  const hasRow = (await row.count()) > 0;
  if (hasRow) {
    const before = await page.evaluate(() => document.body.innerText.length);
    await row.click({ timeout: 2000 }).catch((e) => console.log('ROW CLICK FAIL', String(e).slice(0, 140)));
    await wait(300);
    const after = await page.evaluate(() => document.body.innerText.length);
    console.log(`cycle ${i} row clicked, len ${before} -> ${after}`);
  }
  await page.getByRole('button', { name: '홈으로' }).tap().catch(() => {});
  await wait(500);
}

console.log('errors', errors);
await browser.close();
