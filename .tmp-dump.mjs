import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
const wait = (ms) => page.waitForTimeout(ms);

page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 200)));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await wait(1200);
await page.getByText('위로 밀어 잠금 해제').click();
await wait(900);

const dump = async (label) =>
  console.log(
    label,
    JSON.stringify(
      await page.evaluate(() => {
        const all = [...document.querySelectorAll('div')].filter((d) =>
          String(d.className).includes('inset-0'),
        );
        return {
          z30: document.querySelectorAll('div.absolute.inset-0.z-30').length,
          inset: all.slice(0, 8).map((d) => String(d.className).slice(0, 90)),
          recents: JSON.parse(localStorage.getItem('phone-os:os') || '{}')?.state?.recents,
          open: JSON.parse(localStorage.getItem('phone-os:os') || '{}')?.state?.openAppId,
        };
      }),
      null,
      2,
    ),
  );

await dump('home');
const icon = page.getByRole('button', { name: '거래', exact: true }).first();
console.log('icon count', await icon.count(), 'box', await icon.boundingBox());
await icon.click({ timeout: 3000 }).catch((e) => console.log('CLICK FAIL', String(e).slice(0, 150)));
await wait(1000);
await dump('after open');
await page.screenshot({ path: 'C:/Users/user 1/AppData/Local/Temp/opencode/after-open.png' });

await browser.close();
