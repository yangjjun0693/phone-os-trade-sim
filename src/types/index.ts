import type { ComponentType } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/** Full-screen overlays that sit above the home screen. */
export type OverlayKind = 'none' | 'notification' | 'control' | 'appSwitcher';

/** Hidden behaviour of a fake grey-market site. Nothing is fully reliable. */
export type MarketStatus = 'legit' | 'scam' | 'honeypot' | 'closing';

export type CustomerKind = 'regular' | 'difficult' | 'undercover';

export type RiskTier = 'calm' | 'watched' | 'hot' | 'burned';

/** Identity kinds for the fictional game identity system. */
export type IdentityKind = 'realname' | 'alias';

export interface IdentityState {
  /** Currently active identity for this app. */
  active: IdentityKind;
  /** Whether the user has explicitly logged in with this identity. */
  loggedIn: boolean;
  /** Timestamp of last identity switch (game time). */
  lastSwitchedAt: string | null;
}

export interface AppIdentityMap {
  [appId: string]: IdentityState;
}

export interface PhoneStatus {
  battery: number;
  charging: boolean;
  signal: number;
  wifi: boolean;
}

export interface AppMeta {
  id: string;
  name: string;
  /** Self-contained icon tile (parody artwork, drawn in SVG). */
  icon: ComponentType<{ size?: number; className?: string }>;
  /** [from, to] CSS colours used for the app-switcher / window chrome. */
  gradient: [string, string];
  Component: ComponentType;
}

export interface HomeLayout {
  /** Ordered app ids per home page. */
  pages: string[][];
  /** Ordered app ids pinned to the dock (max 4 shown). */
  dock: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  unitCost: number;
}

export interface GameNotification {
  id: string;
  appId?: string;
  title: string;
  body: string;
  /** ISO string in game time. */
  date: string;
}

export interface MarketSite {
  id: string;
  name: string;
  /** Cosmetic tagline shown in the fake browser. */
  tagline: string;
  status: MarketStatus;
  openedDaysAgo: number;
  /** Arbitrary hidden traits the player can learn to read. */
  traits: string[];
}

export interface NpcProfile {
  id: string;
  name: string;
  kind: CustomerKind;
  /** Cosmetic bio shown in the messenger. */
  bio: string;
}

export interface Clue {
  id: string;
  marketId: string;
  text: string;
  /** true when the clue is real signal, false when it is deliberate noise. */
  reliable: boolean;
}

/** Browser history entry stored in gameStore. */
export interface BrowserHistoryEntry {
  id: string;
  appId: string; // which browser: chroma, sailor, shade
  url: string;
  title: string;
  visitedAt: string; // game time ISO
}
