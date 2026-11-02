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

const info = await page.evaluate(() => {
  const bar = [...document.querySelectorAll('.wallpaper-ink')].find((el) =>
    el.textContent?.includes(':'),
  );
  const spans = [...bar.querySelectorAll('span')].map((el) => ({
    cls: el.className,
    color: getComputedStyle(el).color,
    bg: getComputedStyle(el).backgroundColor,
    border: getComputedStyle(el).borderColor,
    text: el.textContent?.slice(0, 12),
  }));
  return { barColor: getComputedStyle(bar).color, barClass: bar.className, spans };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
