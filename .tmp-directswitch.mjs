import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
const wait = (ms) => page.waitForTimeout(ms);

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await wait(1100);
await page.getByText('위로 밀어 잠금 해제').click();
await wait(700);

const windows = () =>
  page.evaluate(() => {
    const list = [...document.querySelectorAll('div.absolute.inset-0.z-30')];
    return list.map((w, i) => {
      const cs = getComputedStyle(w);
      return {
        i,
        op: cs.opacity,
        pe: cs.pointerEvents,
        transform: cs.transform,
        text: (w.textContent || '').trim().slice(0, 30),
      };
    });
  });

const probe = (label) =>
  page.evaluate((label) => {
    const wins = [...document.querySelectorAll('div.absolute.inset-0.z-30')];
    const last = wins[wins.length - 1];
    if (!last) return { label, error: 'no window' };
    const btn = [...last.querySelectorAll('button')].find((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 20 && r.top > 60 && r.bottom < innerHeight - 20;
    });
    if (!btn) return { label, error: 'no button' };
    const r = btn.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      label,
      windows: wins.length,
      button: (btn.getAttribute('aria-label') || btn.textContent || '').trim().slice(0, 24),
      top: top ? `${top.tagName}.${String(top.className).slice(0, 50)}` : null,
      sameWindow: !!(top && (last.contains(top) || top.contains(last))),
    };
  }, label);

async function openFromHome(name) {
  await page.getByRole('button', { name, exact: true }).first().click({ timeout: 2500 }).catch(() => {});
  await wait(800);
}

async function longSwipeSwitcher() {
  await page.mouse.move(215, 880);
  await page.mouse.down();
  for (let i = 1; i <= 8; i += 1) await page.mouse.move(215, 880 - (330 / 8) * i);
  await page.mouse.up();
  await wait(650);
}

const report = [];
const sequence = ['거래', '메시지/통화', '설정', 'Chroma', 'Gmall', 'Maps'];

await openFromHome(sequence[0]);
for (let i = 1; i < sequence.length; i += 1) {
  await longSwipeSwitcher();
  const cards = page.locator('button[aria-label$="열기"]');
  const count = await cards.count();
  const names = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  const target = page.locator(`button[aria-label="${sequence[i]} 열기"]`).first();
  const exists = (await target.count()) > 0;
  if (exists) await target.click({ timeout: 2500 }).catch(() => {});
  await wait(80);
  report.push({ step: `switch->${sequence[i]} @80ms`, cards: count, names, windows: await windows(), probe: await probe('80ms') });
  await wait(1200);
  report.push({ step: `switch->${sequence[i]} @settled`, windows: await windows(), probe: await probe('settled') });
}

console.log(JSON.stringify(report, null, 2));
await browser.close();
