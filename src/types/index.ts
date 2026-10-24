import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/** Full-screen overlays that sit above the home screen. */
export type OverlayKind = 'none' | 'notification' | 'control' | 'appSwitcher';

/** Hidden behaviour of a fake grey-market site. Nothing is fully reliable. */
export type MarketStatus = 'legit' | 'scam' | 'honeypot' | 'closing';

export type CustomerKind = 'regular' | 'difficult' | 'undercover';

export type RiskTier = 'calm' | 'watched' | 'hot' | 'burned';

export interface PhoneStatus {
  battery: number;
  charging: boolean;
  signal: number;
  wifi: boolean;
}

export interface AppMeta {
  id: string;
  name: string;
  /** Glyph drawn on top of the generated gradient tile (must not be a brand mark). */
  icon: LucideIcon;
  /** [from, to] CSS colours for the icon tile gradient. */
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
