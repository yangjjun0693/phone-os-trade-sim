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

async function layers() {
  return page.evaluate(() => {
    const pts = [
      [215, 300],
      [215, 500],
      [215, 700],
    ];
    return pts.map(([x, y]) =>
      document.elementsFromPoint(x, y).slice(0, 4).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          cls: String(el.className).slice(0, 70),
          pe: getComputedStyle(el).pointerEvents,
          rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
          text: (el.textContent || '').trim().slice(0, 24),
        };
      }),
    );
  });
}

async function auditApp(label) {
  return page.evaluate((label) => {
    const win = document.querySelector('div.absolute.inset-0.z-30');
    if (!win) return { label, error: 'no app window' };
    const buttons = [...win.querySelectorAll('button')].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width >= 20 && r.height >= 20 && r.top >= 0 && r.bottom <= innerHeight;
    });
    const blocked = [];
    for (const b of buttons) {
      const r = b.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (top && top !== b && !b.contains(top) && !top.contains(b)) {
        blocked.push({
          label: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 24),
          top: `${top.tagName}.${String(top.className).slice(0, 60)}`,
        });
      }
    }
    return { label, buttons: buttons.length, blocked: blocked.slice(0, 4), blockedCount: blocked.length };
  }, label);
}

async function openApp(name) {
  const icon = page.getByRole('button', { name, exact: true }).first();
  await icon.click({ timeout: 2500 }).catch(() => {});
  await wait(700);
}

async function goHome() {
  await page.getByRole('button', { name: '홈으로' }).click({ timeout: 2500 }).catch(() => {});
  await wait(500);
}

async function swipeUpSwitcher() {
  await page.mouse.move(215, 880);
  await page.mouse.down();
  for (let i = 1; i <= 6; i += 1) await page.mouse.move(215, 880 - (300 / 6) * i);
  await page.mouse.up();
  await wait(600);
}

const report = [];
const apps = ['거래', '메시지/통화', '설정', 'Chroma', 'Gmall', 'Maps', '초콜렛뱅크', '초선일보', '구팡', 'Maps', 'steak'];

for (let cycle = 0; cycle < 4; cycle += 1) {
  for (const name of apps) {
    await openApp(name);
    report.push(await auditApp(`${cycle}:${name}`));
    await goHome();
    await swipeUpSwitcher();
    // Tap the first switcher card, then reopen the app.
    const cards = page.locator('button[aria-label$="열기"]');
    const cardCount = await cards.count();
    if (cardCount > 0) {
      await cards.first().click({ timeout: 2500 }).catch((e) => {
        report.push({ label: `switcher-card-click`, error: String(e).slice(0, 120) });
      });
      await wait(700);
      report.push(await auditApp(`${cycle}:from-switcher`));
      await goHome();
    } else {
      report.push({ label: `${cycle}:switcher`, error: 'no cards' });
      await goHome();
    }
  }
}

const bad = report.filter((r) => r.blockedCount > 0 || r.error);
console.log(JSON.stringify({ bad: bad.slice(0, 20), total: report.length, errors: errors.slice(0, 3) }, null, 2));

if (bad.length) {
  await page.screenshot({ path: 'C:/Users/user 1/AppData/Local/Temp/opencode/stress-fail.png' });
  const l = await layers();
  console.log('LAYERS', JSON.stringify(l, null, 2));
}

await browser.close();
