import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = 'docs/ui-audit';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });

// Unlock.
await page.getByText('위로 밀어 잠금 해제').click();
await page.waitForTimeout(900);

async function swipeLeft() {
  await page.mouse.move(350, 430);
  await page.mouse.down();
  for (let x = 350; x >= 40; x -= 15) {
    await page.mouse.move(x, 430, { steps: 1 });
    await page.waitForTimeout(18);
  }
  await page.mouse.up();
  await page.waitForTimeout(750);
}

await page.screenshot({ path: `${OUT}/home-page-1.png` });
await swipeLeft();
await page.screenshot({ path: `${OUT}/home-page-2.png` });
await swipeLeft();
await page.screenshot({ path: `${OUT}/home-page-3.png` });

// Settings → identity section.
await page.getByRole('button', { name: '설정' }).first().click();
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/settings.png` });

await browser.close();
console.log('screenshots written to', OUT);
