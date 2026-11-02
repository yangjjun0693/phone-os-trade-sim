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

const apps = ['지갑', '메모', 'Gmall', 'Protean', 'Telegraph', 'Ex', '포럼', 'Sailor', 'Shade', '연락처', 'Maps', '초콜렛뱅크', '초선일보', '구팡', 'steak'];
let seed = 20261027;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

async function audit(label) {
  return page.evaluate((label) => {
    const switcher = document.querySelector('button[aria-label$="열기"]');
    if (switcher) return null;
    const win = document.querySelector('div.absolute.inset-0.z-30');
    if (!win) return null;
    const cs = getComputedStyle(win);
    if (cs.opacity === '0' || cs.pointerEvents === 'none') return null;
    const bad = [];
    for (const b of win.querySelectorAll('button')) {
      const r = b.getBoundingClientRect();
      if (r.width < 20 || r.height < 20 || r.top < 0 || r.bottom > innerHeight) continue;
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (top && top !== b && !b.contains(top) && !win.contains(top)) {
        bad.push({
          button: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 20),
          top: `${top.tagName}.${String(top.className).slice(0, 60)}`,
        });
      }
    }
    const outside = [];
    for (const b of win.querySelectorAll('button')) {
      const r = b.getBoundingClientRect();
      if (r.width < 20 || r.height < 20 || r.top < 0 || r.bottom > innerHeight) continue;
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      // A foreign element above the app window that starts with z-45 or z-90.
      if (top && !win.contains(top) && top !== document.body) {
        const path = [];
        for (let e = top; e && e !== document.body; e = e.parentElement) {
          const z = getComputedStyle(e).zIndex;
          if (z && z !== 'auto') path.push(`${e.tagName}.${String(e.className).slice(0, 28)} z=${z}`);
        }
        if (path.length) outside.push({ button: (b.textContent || '').trim().slice(0, 16), path: path.slice(0, 3) });
      }
    }
    return { label, bad: bad.slice(0, 5), outside: outside.slice(0, 5) };
  }, label);
}

async function gesture(points) {
  await page.mouse.move(points[0][0], points[0][1]);
  await page.mouse.down();
  for (const [x, y] of points.slice(1)) {
    await page.mouse.move(x, y);
    await wait(10);
  }
  await page.mouse.up();
}

const topLeftDown = () => gesture([[50, 5], [52, 40], [55, 120], [58, 220]]);
const topRightDown = () => gesture([[380, 5], [378, 40], [375, 120], [372, 220]]);
const swipeUp = () => gesture([[215, 880], [215, 800], [215, 700], [215, 560]]);

const log = [];
let failures = 0;

for (let step = 0; step < 240; step += 1) {
  const roll = rnd();
  const label = `step ${step} roll ${roll.toFixed(2)}`;

  if (roll < 0.3) {
    // Open an app from home (may hit an app, or the switcher if one is open).
    if (await page.locator('button[aria-label$="열기"]').count()) {
      const card = page.locator('button[aria-label$="열기"]').nth(Math.floor(rnd() * 3));
      await card.click({ timeout: 1500 }).catch(() => {});
    } else {
      await page.getByRole('button', { name: pick(apps), exact: true }).first().click({ timeout: 1500 }).catch(() => {});
    }
    await wait(450);
  } else if (roll < 0.45) {
    await swipeUp();
    await wait(450);
  } else if (roll < 0.55) {
    await topLeftDown();
    await wait(350);
    await page.getByRole('button', { name: '홈으로' }).click({ timeout: 1200 }).catch(() => {});
    await wait(300);
  } else if (roll < 0.65) {
    await topRightDown();
    await wait(350);
    await page.getByRole('button', { name: '홈으로' }).click({ timeout: 1200 }).catch(() => {});
    await wait(300);
  } else if (roll < 0.8) {
    await page.getByRole('button', { name: '홈으로' }).click({ timeout: 1200 }).catch(() => {});
    await wait(320);
  } else {
    // Tap a random visible button inside the app.
    const clicked = await page.evaluate(() => {
      const win = document.querySelector('div.absolute.inset-0.z-30');
      if (!win) return false;
      const list = [...win.querySelectorAll('button')].filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 24 && r.height > 24 && r.top > 60 && r.bottom < innerHeight - 10;
      });
      if (!list.length) return false;
      const b = list[Math.floor(Math.random() * list.length)];
      b.click();
      return true;
    });
    if (!clicked) {
      await page.getByRole('button', { name: '홈으로' }).click({ timeout: 1200 }).catch(() => {});
    }
    await wait(280);
  }

  const result = await audit(label);
  if (result && result.bad.length) {
    failures += 1;
    log.push(result);
    console.log('BLOCKED', JSON.stringify(result));
    await page.screenshot({ path: `C:/Users/user 1/AppData/Local/Temp/opencode/fuzz-${step}.png` });
    if (failures >= 3) break;
  }
}

console.log('done. failures', failures, 'errors', errors.slice(0, 4));
console.log(JSON.stringify(log.slice(0, 3), null, 2));
await browser.close();
