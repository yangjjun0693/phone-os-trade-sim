import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
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
await page.waitForTimeout(900);
await page.getByText('위로 밀어 잠금 해제').click();
await page.waitForTimeout(900);

// open control centre
await page.mouse.move(400, 18);
await page.mouse.down();
await page.mouse.move(400, 340, { steps: 14 });
await page.mouse.up();
await page.waitForTimeout(700);

const info = await page.evaluate(() => {
  const veil = document.querySelector('.overlay-veil');
  const wall = veil?.parentElement?.querySelector('.os-wallpaper');
  const cs = veil ? getComputedStyle(veil) : null;
  return {
    veilBg: cs?.backgroundColor,
    veilFilter: cs?.backdropFilter,
    veilRect: veil?.getBoundingClientRect().toJSON(),
    wallRect: wall?.getBoundingClientRect().toJSON(),
    wallBgImage: wall ? getComputedStyle(wall).backgroundImage.slice(0, 120) : null,
    wallOpacity: wall ? getComputedStyle(wall).opacity : null,
    rootZ: veil?.parentElement?.parentElement ? getComputedStyle(veil.parentElement.parentElement).zIndex : null,
    wallZ: wall ? getComputedStyle(wall).zIndex : null,
    parentOverflow: veil?.parentElement?.parentElement
      ? getComputedStyle(veil.parentElement.parentElement).overflow
      : null,
  };
});
console.log(JSON.stringify(info, null, 2));

// sample: screenshot of the overlay itself, then hide the veil and take another
await page.screenshot({ path: 'docs/ui-audit/debug-veil-on.png' });
await page.evaluate(() => {
  const veil = document.querySelector('.overlay-veil');
  if (veil) {
    veil.style.background = 'transparent';
    veil.style.backdropFilter = 'none';
    veil.style.webkitBackdropFilter = 'none';
  }
});
await page.waitForTimeout(300);
await page.screenshot({ path: 'docs/ui-audit/debug-veil-off.png' });

await browser.close();
