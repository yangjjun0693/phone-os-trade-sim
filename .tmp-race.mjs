import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
const wait = (ms) => page.waitForTimeout(ms);

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await wait(1200);
await page.getByText('위로 밀어 잠금 해제').click();
await wait(800);

const snap = () =>
  page.evaluate(() => {
    const wins = [...document.querySelectorAll('div.absolute.inset-0.z-30')];
    return wins.map((w) => {
      const cs = getComputedStyle(w);
      const inner = w.firstElementChild ? getComputedStyle(w.firstElementChild) : null;
      const r = w.getBoundingClientRect();
      return {
        op: cs.opacity,
        pe: cs.pointerEvents,
        z: cs.zIndex,
        innerOp: inner?.opacity,
        rect: [Math.round(r.x), Math.round(r.y)],
        txt: (w.textContent || '').trim().slice(0, 18),
      };
    });
  });

async function swipeUp(delay = 10) {
  await page.mouse.move(215, 880);
  await page.mouse.down();
  for (let i = 1; i <= 7; i += 1) {
    await page.mouse.move(215, 880 - (320 / 7) * i);
    await wait(delay);
  }
  await page.mouse.up();
}

const reports = [];
for (let i = 0; i < 15; i += 1) {
  await page.getByRole('button', { name: '설정', exact: true }).first().click({ timeout: 2500 }).catch(() => {});
  await wait(450 + (i % 3) * 120);
  await swipeUp();
  // Tap the card as soon as it exists.
  const card = page.locator('button[aria-label="설정 열기"]').first();
  const found = await card.count().catch(() => 0);
  if (!found) {
    reports.push({ i, error: 'no card' });
    continue;
  }
  await card.click({ timeout: 1200, noWaitAfter: true }).catch((e) => reports.push({ i, click: String(e).slice(0, 80) }));
  await wait(30);
  const early = await snap();
  await wait(900);
  const late = await snap();
  reports.push({ i, early, late });

  // Check a button in the late app is on top.
  const probe = await page.evaluate(() => {
    const win = document.querySelector('div.absolute.inset-0.z-30');
    if (!win) return 'no win';
    const btn = [...win.querySelectorAll('button')].find((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 24 && r.top > 100 && r.bottom < innerHeight - 20;
    });
    if (!btn) return 'no btn';
    const r = btn.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { inside: win.contains(top), top: String(top.className).slice(0, 40) };
  });
  reports[reports.length - 1].probe = probe;

  await page.getByRole('button', { name: '홈으로' }).click({ timeout: 1200 }).catch(() => {});
  await wait(350);
}

console.log(JSON.stringify(reports, null, 2));
await browser.close();
