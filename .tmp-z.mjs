import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem(
    'phone-os:tutorial',
    JSON.stringify({
      state: {
        introSeen: true,
        setupDone: true,
        active: false,
        stepIndex: 0,
        done: [],
        openedApps: [],
        deviceName: '테스트의 iPhone',
        defaultIdentity: 'alias',
        notifications: true,
        sound: true,
      },
      version: 1,
    }),
  );
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const pick = (el) =>
    el && {
      tag: el.tagName,
      cls: String(el.className).slice(0, 90),
      z: getComputedStyle(el).zIndex,
      pos: getComputedStyle(el).position,
      text: el.textContent?.slice(0, 20),
    };
  const atTime = document.elementFromPoint(30, 30);
  const atBattery = document.elementFromPoint(400, 30);
  const lock = [...document.querySelectorAll('div')].find(
    (el) => el.className.includes && el.className.includes('z-[45]'),
  );
  const status = [...document.querySelectorAll('div')].find(
    (el) => el.className.includes && el.className.includes('items-center justify-between px-7'),
  );
  return {
    statusRootZ: (() => {
      const el = [...document.querySelectorAll('div')].find(
        (n) => n.className.includes && n.className.includes('pointer-events-none absolute inset-x-0 top-0'),
      );
      return el ? { cls: el.className, z: getComputedStyle(el).zIndex } : null;
    })(),
    atTime: pick(atTime),
    atTimeParents: (() => {
      const arr = [];
      let el = atTime;
      for (let i = 0; i < 4 && el; i += 1) {
        arr.push(pick(el));
        el = el.parentElement;
      }
      return arr;
    })(),
    atBattery: pick(atBattery),
    stackAtTime: document.elementsFromPoint(30, 30).slice(0, 8).map(pick),
    lock: pick(lock),
    status: pick(status),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
