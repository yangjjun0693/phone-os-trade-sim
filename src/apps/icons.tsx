/**
 * Parody app icons.
 *
 * Every icon is a self-contained 64x64 "tile": rounded background + artwork, so
 * it reads like a real iOS home-screen icon instead of a line glyph floating on
 * a gradient. The six parody browsers/mail/messengers follow the silhouette of
 * their open-source reference marks (simple-icons, CC0) but are redrawn with
 * parody names and slightly altered geometry. Default apps use iOS-style art.
 *
 * No official brand assets, wordmarks or trademarked files are bundled.
 */

import type { CSSProperties } from 'react';

export interface AppIconProps {
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean;
}

const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = rad(deg);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}

function r2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Annular sector, angles clockwise from 12 o'clock. */
function sector(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number) {
  const [x1, y1] = polar(cx, cy, rOuter, start);
  const [x2, y2] = polar(cx, cy, rOuter, end);
  const [x3, y3] = polar(cx, cy, rInner, end);
  const [x4, y4] = polar(cx, cy, rInner, start);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M${r2(x1)} ${r2(y1)}`,
    `A${rOuter} ${rOuter} 0 ${large} 1 ${r2(x2)} ${r2(y2)}`,
    `L${r2(x3)} ${r2(y3)}`,
    `A${rInner} ${rInner} 0 ${large} 0 ${r2(x4)} ${r2(y4)}`,
    'Z',
  ].join(' ');
}

/* ------------------------------------------------------------------ */
/* Browsers                                                            */
/* ------------------------------------------------------------------ */

/** Chroma — everyday browser. Tri-colour ring like a certain open-source browser. */
export function ChromaIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="chroma-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6e9ef" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#chroma-tile)" />
      <circle cx="32" cy="32" r="21.5" fill="#ffffff" />
      <path d={sector(32, 32, 25, 12.5, -57, 57)} fill="#ea4335" />
      <path d={sector(32, 32, 25, 12.5, 63, 177)} fill="#34a853" />
      <path d={sector(32, 32, 25, 12.5, 183, 297)} fill="#fbbc05" />
      <circle cx="32" cy="32" r="13.5" fill="#ffffff" />
      <circle cx="32" cy="32" r="10" fill="#4285f4" />
    </svg>
  );
}

/** Sailor — default browser. Compass on a blue sky. */
export function SailorIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sailor-tile" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#4fc3f7" />
          <stop offset="0.55" stopColor="#1e88e5" />
          <stop offset="1" stopColor="#0b57d0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#sailor-tile)" />
      <circle cx="32" cy="32" r="24" fill="#ffffff" opacity="0.14" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.95" />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = i * 15;
        const major = i % 6 === 0;
        const rIn = major ? 16.5 : 19;
        const [x1, y1] = polar(32, 32, rIn, angle);
        const [x2, y2] = polar(32, 32, 20.5, angle);
        return (
          <line
            key={angle}
            x1={r2(x1)}
            y1={r2(y1)}
            x2={r2(x2)}
            y2={r2(y2)}
            stroke="#ffffff"
            strokeWidth={major ? 2 : 1}
            strokeLinecap="round"
            opacity={major ? 0.95 : 0.6}
          />
        );
      })}
      <g transform="rotate(45 32 32)">
        <polygon points="32,12 35.5,32 32,32 28.5,32" fill="#ff3b30" />
        <polygon points="32,52 35.5,32 32,32 28.5,32" fill="#f1f5f9" />
      </g>
      <circle cx="32" cy="32" r="2.4" fill="#ffffff" />
    </svg>
  );
}

/** Shade — anonymous browser. Onion on a purple circuit board. */
export function ShadeIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="shade-tile" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#8b3f9e" />
          <stop offset="1" stopColor="#4a1b63" />
        </linearGradient>
        <linearGradient id="shade-onion" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8e063" />
          <stop offset="1" stopColor="#3f9d3a" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#shade-tile)" />
      <g stroke="#ffffff" strokeWidth="0.9" opacity="0.16" fill="none">
        <path d="M6 16h8v8h10M58 48h-8v-8H40M8 50h6v-6M56 12h-6v6" />
      </g>
      <g>
        <g fill="none" stroke="#7ed957" strokeWidth="3" strokeLinecap="round">
          <path d="M32 20c0-5.5 1.4-8.4 4.4-11" />
          <path d="M32 20c-1-4.6-2.8-7-6-8.6" />
          <path d="M32 20v-9" />
        </g>
        <path
          d="M32 18c-9.6 0-16 7.4-16 16.4C16 44 22.6 51 32 51s16-7 16-16.6C48 25.4 41.6 18 32 18Z"
          fill="url(#shade-onion)"
        />
        <g fill="none" stroke="#4a1b63" strokeWidth="1.7" strokeLinecap="round" opacity="0.8">
          <path d="M32 19v31" />
          <path d="M24.5 21.5c-3.4 7-3.4 19 0 26" />
          <path d="M39.5 21.5c3.4 7 3.4 19 0 26" />
          <path d="M19 30c-1 5-1 9 0 14" />
          <path d="M45 30c1 5 1 9 0 14" />
        </g>
        <g stroke="#7ed957" strokeWidth="1.6" strokeLinecap="round">
          <path d="M25 51.5l-2 3M32 52v3.4M39 51.5l2 3" />
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Mail                                                                */
/* ------------------------------------------------------------------ */

/** Gmall — real-name mail. Blue tile, white envelope, ID shield. */
export function GmallIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="gmall-tile" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#gmall-tile)" />
      <rect x="9" y="18" width="46" height="30" rx="4" fill="#ffffff" />
      <path d="M9 22l23 15 23-15" fill="none" stroke="#bfdbfe" strokeWidth="3" strokeLinejoin="round" />
      <path d="M9 22l23 15 23-15v-1a3 3 0 0 0-3-3H12a3 3 0 0 0-3 3Z" fill="#eff6ff" />
      <g>
        <path d="M44 34l8-3.6 8 3.6v8.2c0 4-3.6 7.2-8 8.4-4.4-1.2-8-4.4-8-8.4Z" fill="#2563eb" />
        <path d="M48.4 40.6l2.4 2.4 4-4.4" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** Protean — alias mail. Purple tile, layered envelope like an encrypted mail service. */
export function ProteanIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="protean-tile" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#8b7bff" />
          <stop offset="1" stopColor="#5b4ae0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#protean-tile)" />
      <g opacity="0.4">
        <rect x="13" y="24" width="42" height="27" rx="4" fill="#d9d4ff" />
      </g>
      <rect x="10" y="18" width="44" height="29" rx="4" fill="#ffffff" />
      <path d="M10 22l22 14.5L54 22" fill="none" stroke="#6d5efc" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M10 22l22 14.5L54 22v-1a3 3 0 0 0-3-3H13a3 3 0 0 0-3 3Z" fill="#f2f0ff" />
      <path d="M22 40h20" stroke="#cfc9ff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** Mail — default mail app. iOS-style blue envelope. */
export function MailIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mail-tile" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#5ac8fa" />
          <stop offset="1" stopColor="#007aff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#mail-tile)" />
      <rect x="10" y="19" width="44" height="28" rx="4" fill="#ffffff" />
      <path d="M10 23l22 14 22-14" fill="none" stroke="#cfe8ff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M10 23l22 14 22-14v-1a3 3 0 0 0-3-3H13a3 3 0 0 0-3 3Z" fill="#f4fbff" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Messengers                                                          */
/* ------------------------------------------------------------------ */

/** Telegraph — secret messenger. Blue tile, white paper plane. */
export function TelegraphIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="telegraph-tile" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#3fc6f5" />
          <stop offset="1" stopColor="#1c93cf" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#telegraph-tile)" />
      <path d="M13 30.5L51.4 15.8c1.2-.5 2.3.6 1.9 1.8l-11.9 35.2c-.4 1.3-2.2 1.5-2.9.3l-5.9-10-10.4 7.5c-1 .7-2.4 0-2.4-1.3l.2-10.4-7-4.1c-1.2-.7-1.1-2.5.1-3.1l-.1-.2Z" fill="#ffffff" />
      <path d="M22 33.2l26-14.1-18.7 21.9.1 7.5 5.3-8.9 9.8 6.7 9.5-28.4Z" fill="#d7f1fd" opacity="0.9" />
    </svg>
  );
}

/** Ex — public feed. Charcoal tile with a stark X. */
export function ExIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ex-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c1c1e" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#ex-tile)" />
      <path d="M12 12h8.4l11.6 16 11.6-16H52L37.2 32 52 52h-8.4L32 36l-11.6 16H12l14.8-20L12 12Z" fill="#ffffff" />
    </svg>
  );
}

/** Messages/Call — real-name chat. iOS green bubble. */
export function MessagesCallIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="messages-call-tile" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#6ee87b" />
          <stop offset="1" stopColor="#12b53c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#messages-call-tile)" />
      <path
        d="M32 13c-11.3 0-20 6.9-20 15.4 0 4.7 2.6 8.9 6.7 11.6-.5 3.5-2 6.3-4.2 8.4-.6.5-.2 1.5.6 1.4 5.6-.6 9.9-2.4 12.7-4.3 1.4.2 2.8.3 4.2.3 11.3 0 20-6.9 20-15.4S43.3 13 32 13Z"
        fill="#ffffff"
      />
      <circle cx="23" cy="28.4" r="2.5" fill="#12b53c" />
      <circle cx="32" cy="28.4" r="2.5" fill="#12b53c" />
      <circle cx="41" cy="28.4" r="2.5" fill="#12b53c" />
    </svg>
  );
}

/** Messages — legacy green bubble. */
export function MessagesIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="messages-tile" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#6ee87b" />
          <stop offset="1" stopColor="#12b53c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#messages-tile)" />
      <path
        d="M32 14c-10.5 0-19 6.4-19 14.3 0 4.4 2.5 8.3 6.4 10.9-.5 3.2-1.9 5.8-4 7.8-.6.5-.2 1.4.5 1.3 5.4-.5 9.5-2.2 12.1-4 1.3.2 2.6.3 4 .3 10.5 0 19-6.4 19-14.3S42.5 14 32 14Z"
        fill="#ffffff"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Default iOS-style apps                                              */
/* ------------------------------------------------------------------ */

/** Trade — market watchlist. Black tile with a rising line. */
export function TradeIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="trade-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2c2e" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        <linearGradient id="trade-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#30d158" stopOpacity="0.35" />
          <stop offset="1" stopColor="#30d158" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#trade-tile)" />
      <g stroke="#ffffff" strokeWidth="0.7" opacity="0.12">
        <path d="M10 18h44M10 29h44M10 40h44" />
        <path d="M18 8v48M32 8v48M46 8v48" />
      </g>
      <path d="M11 42l10-8 7 5 10-13 6 4 9-12v30H11Z" fill="url(#trade-fill)" />
      <polyline
        points="11 42 21 34 28 39 38 26 44 30 53 18"
        fill="none"
        stroke="#30d158"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="53" cy="18" r="3" fill="#30d158" />
    </svg>
  );
}

/** Wallet — cards on a black leather wallet. */
export function WalletIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="wallet-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3a3c" />
          <stop offset="1" stopColor="#101012" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#wallet-tile)" />
      <rect x="15" y="13" width="34" height="22" rx="4" fill="#ffd60a" />
      <rect x="13" y="17" width="38" height="22" rx="4" fill="#30d158" />
      <rect x="11" y="21" width="42" height="22" rx="4" fill="#0a84ff" />
      <rect x="9" y="26" width="46" height="27" rx="6" fill="#f2f2f7" />
      <rect x="9" y="33" width="46" height="5" fill="#d1d1d6" />
      <rect x="38" y="38" width="12" height="7" rx="2" fill="#ff9f0a" />
    </svg>
  );
}

/** Notes — ruled paper with a yellow header. */
export function NotesIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="notes-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f2f2f7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#notes-tile)" />
      <path d="M14 0h36a14 14 0 0 1 14 14v4H0v-4A14 14 0 0 1 14 0Z" fill="#ffd60a" />
      <path d="M0 17h64v2.5H0Z" fill="#f0be00" opacity="0.5" />
      <g stroke="#8e8e93" strokeWidth="1.6" strokeLinecap="round" opacity="0.5">
        <path d="M14 28h36M14 37h36M14 46h36M14 55h22" />
      </g>
    </svg>
  );
}

/** Settings — machined gears on the iOS grey. */
export function SettingsIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="settings-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d7d9dd" />
          <stop offset="1" stopColor="#8e9095" />
        </linearGradient>
        <linearGradient id="settings-gear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b6f76" />
          <stop offset="1" stopColor="#3f4349" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#settings-tile)" />
      <g fill="url(#settings-gear)">
        <circle cx="28" cy="27" r="15" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <rect
            key={deg}
            x="24"
            y="8.5"
            width="8"
            height="11.5"
            rx="2.2"
            transform={`rotate(${deg} 28 27)`}
          />
        ))}
      </g>
      <circle cx="28" cy="27" r="6.2" fill="#c9ccd1" />
      <g fill="url(#settings-gear)">
        <circle cx="45" cy="45" r="9.4" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <rect
            key={deg}
            x="42.4"
            y="32.6"
            width="5.2"
            height="8"
            rx="1.6"
            transform={`rotate(${deg} 45 45)`}
          />
        ))}
      </g>
      <circle cx="45" cy="45" r="3.8" fill="#c9ccd1" />
    </svg>
  );
}

/** Forum — overlapping speech bubbles. */
export function ForumIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="forum-tile" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#forum-tile)" />
      <path
        d="M15 14h26a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5H26l-9 7v-7h-2a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5Z"
        fill="#ffffff"
        opacity="0.55"
      />
      <path
        d="M27 24h22a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5h-2v6l-8-6H27a5 5 0 0 1-5-5V29a5 5 0 0 1 5-5Z"
        fill="#ffffff"
      />
      <g stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" opacity="0.55">
        <path d="M30 32h16M30 38h11" />
      </g>
    </svg>
  );
}

/** Contacts — iOS address book silhouette with colour tabs. */
export function ContactsIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="contacts-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7f7fa" />
          <stop offset="1" stopColor="#d8d9de" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#contacts-tile)" />
      <g>
        <rect x="52" y="8" width="6" height="10" rx="1.6" fill="#ff453a" />
        <rect x="52" y="20" width="6" height="10" rx="1.6" fill="#ff9f0a" />
        <rect x="52" y="32" width="6" height="10" rx="1.6" fill="#30d158" />
        <rect x="52" y="44" width="6" height="10" rx="1.6" fill="#0a84ff" />
      </g>
      <circle cx="29" cy="25" r="10" fill="#8e8e93" opacity="0.85" />
      <path d="M11 53c0-9 8-14.5 18-14.5S47 44 47 53Z" fill="#8e8e93" opacity="0.85" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Legacy glyphs (kept for compatibility)                              */
/* ------------------------------------------------------------------ */

/** Browser — generic globe. */
export function BrowserIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="browser-tile" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#browser-tile)" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#ffffff" strokeWidth="2.4" />
      <path d="M14 32h36" stroke="#ffffff" strokeWidth="2.4" />
      <path
        d="M32 14c5 5 7.5 11.2 7.5 18S37 45 32 50c-5-5-7.5-11.2-7.5-18S27 19 32 14Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
      />
    </svg>
  );
}
