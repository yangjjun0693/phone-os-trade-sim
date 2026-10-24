import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = 'docs/ui-audit/icons';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 4,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
await page.goto('http://localhost:5199', { waitUntil: 'networkidle' });
await page.getByText('위로 밀어 잠금 해제').click();
await page.waitForTimeout(700);

const names = ['지갑', '메모', 'Gmall', 'Protean', '거래', '메시지/통화', 'Chroma', '설정'];

// Page 1 icons.
for (const name of ['Gmall', 'Protean', '지갑', '메모']) {
  const el = page.getByRole('button', { name, exact: true }).first();
  await el.screenshot({ path: `${OUT}/${name.replace('/', '-')}.png` });
}

// Swipe to page 2.
async function swipeLeft() {
  await page.mouse.move(335, 420);
  await page.mouse.down();
  for (let x = 335; x >= 55; x -= 20) {
    await page.mouse.move(x, 420, { steps: 2 });
    await page.waitForTimeout(12);
  }
  await page.mouse.up();
  await page.waitForTimeout(500);
}
await swipeLeft();
for (const name of ['Telegraph', 'Ex', 'Sailor', 'Shade']) {
  const el = page.getByRole('button', { name, exact: true }).first();
  await el.screenshot({ path: `${OUT}/${name}.png` });
}

// Dock icons.
for (const name of ['거래', '메시지/통화', 'Chroma', '설정']) {
  const el = page.getByRole('button', { name, exact: true }).first();
  await el.screenshot({ path: `${OUT}/${name.replace('/', '-')}.png` });
}

await browser.close();
console.log('icon shots written', names.length);
