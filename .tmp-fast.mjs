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
    const at = document.elementsFromPoint(215, 430);
    const top = at[0];
    return {
      wins: wins.map((w) => {
        const cs = getComputedStyle(w);
        const r = w.getBoundingClientRect();
        return {
          op: Number(cs.opacity).toFixed(2),
          pe: cs.pointerEvents,
          z: cs.zIndex,
          rect: [Math.round(r.x), Math.round(r.y)],
          txt: (w.textContent || '').trim().slice(0, 14),
        };
      }),
      top: top ? `${top.tagName}.${String(top.className).slice(0, 40)}` : null,
      disabledBtns: document.querySelectorAll('button:disabled').length,
      switcher: document.querySelectorAll('button[aria-label$="열기"]').length,
    };
  });

/** strict: the element under the centre of every visible button must be that button or inside it */
const deadAudit = () =>
  page.evaluate(() => {
    const win = [...document.querySelectorAll('div.absolute.inset-0.z-30')].pop();
    if (!win) return { error: 'no win' };
    if (Number(getComputedStyle(win).opacity) < 0.9) return { error: 'faded', op: getComputedStyle(win).opacity };
    const btns = [...win.querySelectorAll('button,a,[role="button"]')].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 24 && r.height > 24 && r.top >= 0 && r.bottom <= innerHeight;
    });
    if (!btns.length) return { buttons: 0 };
    let blocked = 0;
    const sample = [];
    for (const b of btns) {
      const r = b.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (top && top !== b && !b.contains(top)) {
        blocked += 1;
        if (sample.length < 3)
          sample.push({
            label: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 18),
            top: `${top.tagName}.${String(top.className).slice(0, 50)}`,
            inApp: win.contains(top),
          });
      }
    }
    return { buttons: btns.length, blocked, sample };
  });

const apps = ['trek', '설정', 'Chroma', 'Maps', '메시지/통화'];
const names = ['거래', '설정', 'Chroma', 'Maps', '메시지/통화'];
const gaps = [20, 60, 120, 200];

const log = [];
let bad = 0;

for (let round = 0; round < 40; round += 1) {
  const pick = names[round % names.length];
  const gap = gaps[round % gaps.length];
  await page.getByRole('button', { name: pick, exact: true }).first().click({ timeout: 1500, noWaitAfter: true }).catch(() => {});
  await wait(gap);
  if (round % 3 === 0) {
    await page.getByRole('button', { name: '홈으로' }).click({ timeout: 1500, noWaitAfter: true }).catch(() => {});
    await wait(gaps[(round + 1) % gaps.length]);
    const other = names[(round + 2) % names.length];
    await page.getByRole('button', { name: other, exact: true }).first().click({ timeout: 1500, noWaitAfter: true }).catch(() => {});
    await wait(gap);
  }
  const early = await state();
  await wait(700);
  const settled = await state();
  const audit = await deadAudit();

  const broken =
    settled.wins.length !== 1 ||
    settled.wins.some((w) => Number(w.op) < 0.9 || w.pe === 'none' || w.rect[0] !== 0) ||
    (audit.blocked ?? 0) === audit.buttons ||
    audit.error === 'faded';

  if (broken) {
    bad += 1;
    log.push({ round, pick, gap, early, settled, audit });
    console.log('BROKEN', JSON.stringify({ round, pick, gap, settled, audit }));
    await page.screenshot({ path: `C:/Users/user 1/AppData/Local/Temp/opencode/fast-${round}.png` });
    // recover for the next round
    await page.getByRole('button', { name: '홈으로' }).click({ timeout: 1500 }).catch(() => {});
    await wait(600);
  }
  await page.getByRole('button', { name: '홈으로' }).click({ timeout: 1500 }).catch(() => {});
  await wait(350);
}

console.log('rounds done. broken', bad, 'errors', errors.slice(0, 3));
console.log(JSON.stringify(log.slice(0, 4), null, 2));
await browser.close();
