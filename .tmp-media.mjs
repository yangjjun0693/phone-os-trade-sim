import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 931 } });
const client = await page.context().newCDPSession(page);
await client.send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-transparency', value: 'no-preference' }],
});
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
const media = await page.evaluate(() => ({
  reducedTransparency: matchMedia('(prefers-reduced-transparency: reduce)').matches,
  noPreference: matchMedia('(prefers-reduced-transparency: no-preference)').matches,
}));
console.log(JSON.stringify(media, null, 2));
await browser.close();
