import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
const wait = (ms) => page.waitForTimeout(ms);

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await wait(1200);
await page.getByText('위로 밀어 잠금 해제').click();
await wait(900);

const snap = async (label) => {
  const s = await page.evaluate(() => ({
    appWindows: document.querySelectorAll('div.absolute.inset-0.z-30').length,
    switcher: !!document.querySelector('button[aria-label$="열기"]'),
    switcherRoot: !!document.querySelector('div.absolute.inset-0.z-\\[45\\]'),
    homeVisible: !!document.querySelector('div.relative.flex.h-full.flex-col'),
  }));
  console.log(label, JSON.stringify(s));
};

await snap('home');
await page.getByRole('button', { name: '거래', exact: true }).first().click();
await wait(900);
await snap('app open');

await page.mouse.move(215, 880);
await page.mouse.down();
for (let i = 1; i <= 8; i += 1) {
  await page.mouse.move(215, 880 - (330 / 8) * i);
  await wait(16);
}
await page.mouse.up();
await wait(100);
await snap('swipe +100ms');
await wait(800);
await snap('swipe +900ms');
await page.screenshot({ path: 'C:/Users/user 1/AppData/Local/Temp/opencode/switcher.png' });

const cards = await page.locator('button[aria-label$="열기"]').evaluateAll((els) =>
  els.map((e) => e.getAttribute('aria-label')),
);
console.log('cards', cards);

await browser.close();
