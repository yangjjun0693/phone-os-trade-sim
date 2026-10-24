/**
 * Generates PWA PNG icons with zero image dependencies.
 * A minimal PNG encoder (RGBA8 + zlib deflate) draws an iOS-style squircle
 * with a gradient and a small candlestick glyph. Run with `npm run icons`.
 *
 * NOTE: This only produces original artwork. No Apple assets/trademarks are used.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'public');
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'latin1');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const A = [99, 102, 241]; // indigo
const B = [34, 211, 238]; // cyan
const N = 5; // superellipse exponent (~iOS squircle)

function mix(t) {
  return [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t));
}

/**
 * @param {number} size
 * @param {boolean} maskable fill the whole square (safe-zone art) instead of a squircle
 */
function buildIcon(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  const c = (size - 1) / 2;
  const half = size / 2;
  // For maskable icons art must stay inside the 80% safe zone.
  const artScale = maskable ? 0.62 : 0.86;
  const radius = half * artScale;

  const glyph = {
    bars: [
      { x: -0.42, h: 0.5, up: true },
      { x: 0.0, h: 0.28, up: false },
      { x: 0.42, h: 0.68, up: true },
    ],
    w: 0.16,
  };

  const ss = 3; // supersampling
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let coverage = 0;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;

      for (let sy = 0; sy < ss; sy += 1) {
        for (let sx = 0; sx < ss; sx += 1) {
          const px = x + (sx + 0.5) / ss;
          const py = y + (sy + 0.5) / ss;
          const nx = (px - c) / radius;
          const ny = (py - c) / radius;
          const inside = Math.pow(Math.abs(nx), N) + Math.pow(Math.abs(ny), N) <= 1;

          // background is the full square for maskable, squircle otherwise
          const bgInside = maskable ? true : inside;
          if (!bgInside) continue;

          const grad = (nx + ny + 2) / 4;
          let [r, g, b] = mix(Math.min(1, Math.max(0, grad)));

          // glyph: simple candlestick bars in near-white
          if (inside) {
            const gx = nx;
            const gy = ny;
            for (const bar of glyph.bars) {
              const inX = Math.abs(gx - bar.x) <= glyph.w / 2;
              const top = -bar.h / 2;
              const bottom = bar.h / 2;
              if (inX && gy >= top && gy <= bottom) {
                const edge = Math.min(
                  glyph.w / 2 - Math.abs(gx - bar.x),
                  gy - top,
                  bottom - gy,
                );
                const k = Math.min(1, Math.max(0, (edge / (2 / size)) * 0.9));
                r = Math.round(r + (255 - r) * k);
                g = Math.round(g + (255 - g) * k);
                b = Math.round(b + (255 - b) * k);
              }
            }
          }

          coverage += 1;
          rSum += r;
          gSum += g;
          bSum += b;
        }
      }

      const total = ss * ss;
      const alpha = Math.round((coverage / total) * 255);
      const i = (y * size + x) * 4;
      if (coverage > 0) {
        rgba[i] = Math.round(rSum / coverage);
        rgba[i + 1] = Math.round(gSum / coverage);
        rgba[i + 2] = Math.round(bSum / coverage);
      }
      rgba[i + 3] = alpha;
    }
  }

  return encodePng(size, size, rgba);
}

const targets = [
  ['pwa-192x192.png', 192, false],
  ['pwa-512x512.png', 512, false],
  ['pwa-maskable-512x512.png', 512, true],
  ['apple-touch-icon.png', 180, false],
];

for (const [name, size, maskable] of targets) {
  writeFileSync(resolve(outDir, name), buildIcon(size, maskable));
  process.stdout.write(`generated public/${name} (${size}px)\n`);
}
