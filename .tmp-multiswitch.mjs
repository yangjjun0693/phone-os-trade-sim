import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
const wait = (ms) => page.waitForTimeout(ms);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await wait(1200);
await page.getByText('위로 밀어 잠금 해제').click();
await wait(800);

const state = () =>
  page.evaluate(() => {
    const wins = [...document.querySelectorAll('div.absolute.inset-0.z-30')];
    const stack = document.elementsFromPoint(215, 430).slice(0, 5).map((el) => ({
      cls: String(el.className).slice(0, 44),
      pe: getComputedStyle(el).pointerEvents,
      txt: (el.textContent || '').trim().slice(0, 16),
    }));
    return { wins: wins.length, stack, cards: document.querySelectorAll('button[aria-label$="열기"]').length };
  });

const names = ['거래', '메시지/통화', '설정', 'Chroma', 'Gmall', 'Maps'];

// Seed recents.
for (const n of names) {
  await page.getByRole('button', { name: n, exact: true }).first().click({ timeout: 3000 }).catch(() => {});
  await wait(550);
  await page.getByRole('button', { name: '홈으로' }).click({ timeout: 3000 }).catch(() => {});
  await wait(350);
}
console.log('seeded', await state());

const swipeUp = async () => {
  await page.mouse.move(215, 880);
  await page.mouse.down();
  for (let i = 1; i <= 7; i += 1) await page.mouse.move(215, 880 - (320 / 7) * i);
  await page.mouse.up();
  await wait(650);
};

// Open 거래 directly, then switch apps via switcher without going home.
await page.getByRole('button', { name: '거래', exact: true }).first().click();
await wait(700);

for (let round = 0; round < 8; round += 1) {
  await swipeUp();
  const namesNow = await page
    .locator('button[aria-label$="열기"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  const pick = namesNow[(round + 1) % Math.max(1, namesNow.length)];
  if (!pick) {
    console.log('round', round, 'no cards', await state());
    break;
  }
  await page.locator(`button[aria-label="${pick}"]`).first().click({ timeout: 2500 }).catch((e) => {
    console.log('card click fail', String(e).slice(0, 100));
  });
  await wait(40);
  const s = await state();
  if (s.wins !== 1) console.log('ROUND', round, 'pick', pick, 'EARLY', JSON.stringify(s));
  await wait(900);
  const s2 = await state();
  if (s2.wins !== 1) console.log('ROUND', round, 'pick', pick, 'SETTLED', JSON.stringify(s2));
  else console.log('round', round, 'pick', pick, 'ok', s2.cards);
}

// Final: can we tap an app button?
const probe = await page.evaluate(() => {
  const win = document.querySelector('div.absolute.inset-0.z-30');
  const btn = [...win.querySelectorAll('button')].find((b) => {
    const r = b.getBoundingClientRect();
    return r.width > 24 && r.top > 100 && r.bottom < innerHeight - 20;
  });
  if (!btn) return 'no btn';
  const r = btn.getBoundingClientRect();
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { btn: (btn.textContent || '').trim().slice(0, 20), topCls: String(top.className).slice(0, 50), in: win.contains(top) };
});
console.log('probe', probe, 'errors', errors);
await browser.close();
