import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
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
await wait(1300);
await page.getByText('위로 밀어 잠금 해제').tap();
await wait(900);

// Count pointer/click traffic + DOM mutations so a "dead" tap is measurable.
await page.evaluate(() => {
  window.__t = { down: 0, up: 0, click: 0, mut: 0, touchstart: 0, touchend: 0 };
  window.addEventListener('pointerdown', () => window.__t.down++, true);
  window.addEventListener('pointerup', () => window.__t.up++, true);
  window.addEventListener('pointercancel', () => window.__t.cancel = (window.__t.cancel || 0) + 1, true);
  window.addEventListener('click', () => window.__t.click++, true);
  window.addEventListener('touchstart', () => window.__t.touchstart++, true);
  window.addEventListener('touchend', () => window.__t.touchend++, true);
  new MutationObserver((list) => {
    window.__t.mut += list.length;
  }).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
});

const counters = () => page.evaluate(() => ({ ...window.__t }));

const appSummary = () =>
  page.evaluate(() => {
    const wins = [...document.querySelectorAll('div.absolute.inset-0.z-30')];
    return wins.map((w) => {
      const cs = getComputedStyle(w);
      return {
        op: Number(cs.opacity).toFixed(2),
        pe: cs.pointerEvents,
        txt: (w.textContent || '').trim().slice(0, 12),
      };
    });
  });

async function tapRandomInside() {
  const box = await page.evaluate(() => {
    const win = [...document.querySelectorAll('div.absolute.inset-0.z-30')].pop();
    if (!win) return null;
    const r = win.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (!box) return false;
  const x = box.x + 24 + Math.random() * (box.w - 48);
  const y = box.y + 120 + Math.random() * (box.h - 200);
  await page.touchscreen.tap(x, y);
  return true;
}

const names = ['거래', '설정', 'Chroma', 'Maps', '메시지/통화', '지갑', '메모', 'Gmall', 'Protean', 'Telegraph', 'Ex', '포럼', 'Sailor', 'Shade', '연락처'];
const log = [];
let deadStreak = 0;
let worst = 0;

for (let i = 0; i < 120; i += 1) {
  const name = names[i % names.length];
  await page
    .getByRole('button', { name, exact: true })
    .first()
    .tap({ timeout: 1500 })
    .catch(() => {});
  await wait(500 + (i % 4) * 90);

  // A burst of taps inside the app.
  for (let t = 0; t < 6; t += 1) {
    const before = await counters();
    await tapRandomInside();
    await wait(140);
    const after = await counters();
    const alive =
      after.mut > before.mut || after.click > before.click || after.down > before.down;
    if (!alive) {
      deadStreak += 1;
      worst = Math.max(worst, deadStreak);
      log.push({ i, name, t, before, after, wins: await appSummary() });
      if (deadStreak >= 4) {
        console.log('DEAD STREAK', JSON.stringify(log.slice(-6), null, 2));
        await page.screenshot({ path: 'C:/Users/user 1/AppData/Local/Temp/opencode/dead.png' });
        process.exit(0);
      }
    } else {
      deadStreak = 0;
    }
  }

  await page.getByRole('button', { name: '홈으로' }).tap({ timeout: 1500 }).catch(() => {});
  await wait(300);
}

console.log('done worst dead streak', worst, 'errors', errors.slice(0, 3));
console.log(JSON.stringify(log.slice(0, 5), null, 2));
await browser.close();
