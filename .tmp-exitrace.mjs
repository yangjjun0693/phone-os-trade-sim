import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
const wait = (ms) => page.waitForTimeout(ms);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await wait(1200);
await page.getByText('위로 밀어 잠금 해제').click();
await wait(800);

const state = () =>
  page.evaluate(() => {
    const wins = [...document.querySelectorAll('div.absolute.inset-0.z-30')];
    return {
      n: wins.length,
      wins: wins.map((w) => {
        const cs = getComputedStyle(w);
        return { op: Number(cs.opacity).toFixed(2), pe: cs.pointerEvents, txt: (w.textContent || '').trim().slice(0, 10) };
      }),
      chromaSwitcher: document.querySelectorAll('button[aria-label$="열기"]').length,
    };
  });

const tapToggle = async () => {
  return page.evaluate(() => {
    const win = [...document.querySelectorAll('div.absolute.inset-0.z-30')].pop();
    if (!win) return 'no win';
    const btn = [...win.querySelectorAll('button')].find((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 30 && r.height > 30 && r.top > 90 && r.bottom < innerHeight - 30;
    });
    if (!btn) return 'no btn';
    const r = btn.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return top ? `${top.tagName}.${String(top.className).slice(0, 40)} | in=${btn.contains(top) || top === btn}` : 'none';
  });
};

const out = [];
for (let delay = 100; delay <= 300; delay += 10) {
  await page.getByRole('button', { name: '설정', exact: true }).first().click({ timeout: 2000 }).catch(() => {});
  await wait(400);
  await page.getByRole('button', { name: '홈으로' }).click({ timeout: 2000 }).catch(() => {});
  await wait(delay);
  await page.getByRole('button', { name: '설정', exact: true }).first().click({ timeout: 2000 }).catch(() => {});
  await wait(900);
  const s = await state();
  const probe = await tapToggle();
  if (s.n !== 1 || s.wins.some((w) => Number(w.op) < 0.9) || s.chromaSwitcher || probe.startsWith('') === false) {
    out.push({ delay, s, probe });
    console.log('BAD', delay, JSON.stringify(s), probe);
  } else {
    console.log('ok', delay, JSON.stringify(s.wins), probe);
  }
  // reset
  await page.getByRole('button', { name: '홈으로' }).click({ timeout: 2000 }).catch(() => {});
  await wait(500);
}

console.log('bad count', out.length, 'errors', errors.slice(0, 3));
await browser.close();
