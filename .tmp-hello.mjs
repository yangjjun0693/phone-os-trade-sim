import { chromium } from 'playwright';

const EXPECTED = [
  ['hello', 'latin'],
  ['안녕하세요', 'korean'],
  ['こんにちは', 'japanese'],
  ['你好', 'chinese'],
  ['hola', 'latin'],
  ['مرحبا', 'arabic'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

const seen = [];
for (const [text, script] of EXPECTED) {
  await page.waitForFunction(
    (t) => document.querySelector('.hello-word')?.textContent === t,
    text,
    { timeout: 8000 },
  );
  await page.waitForTimeout(680);
  const info = await page.$eval('.hello-word', (el) => ({
    text: el.textContent,
    script: el.getAttribute('data-script'),
    font: getComputedStyle(el).fontFamily,
    size: getComputedStyle(el).fontSize,
    dir: el.getAttribute('dir'),
    rect: el.getBoundingClientRect().toJSON(),
    fontOk: document.fonts.check(`${getComputedStyle(el).fontSize} "${getComputedStyle(el).fontFamily.split(',')[0].replaceAll('"', '')}"`),
  }));
  seen.push(info);
  await page.screenshot({ path: `docs/ui-audit/hello-${seen.length}-${script}.png` });
}

await page.waitForFunction(() => document.body.innerText.includes('안녕, '), { timeout: 6000 });
await page.waitForTimeout(700);
const finalText = await page.evaluate(() =>
  [...document.querySelectorAll('p')].map((p) => p.textContent).filter(Boolean).slice(0, 4),
);
await page.screenshot({ path: 'docs/ui-audit/hello-7-final.png' });

console.log(JSON.stringify({ seen, finalText, errors }, null, 2));
await browser.close();
