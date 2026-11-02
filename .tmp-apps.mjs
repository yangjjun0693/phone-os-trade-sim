import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 }, deviceScaleFactor: 2 });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-transparency', value: 'no-preference' }],
});
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

const wait = (ms) => page.waitForTimeout(ms);
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
await wait(900);
await page.getByText('위로 밀어 잠금 해제').click();
await wait(900);

const open = async (label) => {
  await page.getByLabel(label).first().click();
  await wait(1100);
};
const home = async () => {
  await page.getByRole('button', { name: '홈으로' }).click();
  await wait(700);
};

for (const [label, name] of [
  ['거래', 'trade'],
  ['초콜렛뱅크', 'bank'],
  ['Telegraph', 'telegraph'],
  ['포럼', 'forum'],
  ['Maps', 'map'],
  ['Chroma', 'chroma'],
  ['지갑', 'wallet'],
]) {
  await open(label);
  await page.screenshot({ path: `docs/ui-audit/app-${name}-light.png` });
  await home();
}

await page.emulateMedia({ colorScheme: 'dark' });
await wait(800);
for (const [label, name] of [
  ['거래', 'trade'],
  ['초콜렛뱅크', 'bank'],
  ['Telegraph', 'telegraph'],
  ['포럼', 'forum'],
  ['Maps', 'map'],
  ['Chroma', 'chroma'],
  ['지갑', 'wallet'],
]) {
  await open(label);
  await page.screenshot({ path: `docs/ui-audit/app-${name}-dark.png` });
  await home();
}

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
