/** `#22d3ee` -> `34 211 238`, the triplet Tailwind's alpha trick expects. */
export function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean;
  const value = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(value)) return '0 122 255';
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}
