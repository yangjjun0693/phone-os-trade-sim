import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
const wait = (ms) => page.waitForTimeout(ms);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await wait(1300);
await page.getByText('위로 밀어 잠금 해제').click();
await wait(800);

const state = () =>
  page.evaluate(() => {
    const win = [...document.querySelectorAll('[data-app-window]')].pop();
    const overlayOpen = !!document.querySelector('div.absolute.inset-0.z-\\[45\\]');
    let probe = 'none';
    if (win) {
      const btn = [...win.querySelectorAll('button')].find((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 30 && r.height > 30 && r.top > 90 && r.bottom < innerHeight - 30;
      });
      if (btn) {
        const r = btn.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        probe = top && (top === btn || btn.contains(top)) ? 'ok' : 'blocked';
      }
    }
    return {
      win: win ? { app: win.getAttribute('data-app-window'), op: Number(getComputedStyle(win).opacity).toFixed(2), pe: getComputedStyle(win).pointerEvents } : null,
      overlayOpen,
      probe,
    };
  });

await page.getByRole('button', { name: '설정', exact: true }).first().click();
await wait(700);
console.log('app', JSON.stringify(await state()));

// notification centre via the island
await page.mouse.click(215, 30);
await wait(600);
console.log('notif open', JSON.stringify(await state()));
await page.getByRole('button', { name: '알림 닫기' }).click().catch(async () => {
  await page.keyboard.press('Escape');
});
await wait(600);
console.log('notif closed', JSON.stringify(await state()));

// control centre via top-right drag
await page.mouse.move(370, 3);
await page.mouse.down();
for (let i = 1; i <= 6; i += 1) await page.mouse.move(370, 3 + i * 40);
await page.mouse.up();
await wait(700);
console.log('control open', JSON.stringify(await state()));
await page.mouse.move(215, 300);
await page.mouse.down();
for (let i = 1; i <= 6; i += 1) await page.mouse.move(215, 300 - i * 45);
await page.mouse.up();
await wait(700);
console.log('control closed', JSON.stringify(await state()));

// toggle still works
const before = await page.evaluate(() => document.documentElement.className);
await page.locator('[data-app-window] button[role="switch"]').first().click({ timeout: 2000 }).catch((e) => console.log('toggle fail', String(e).slice(0, 80)));
await wait(400);
const after = await page.evaluate(() => document.documentElement.className);
console.log('toggle', before, '->', after, 'changed', before !== after);

console.log('errors', errors.slice(0, 3));
await browser.close();
