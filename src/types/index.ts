import type { ComponentType } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/** Full-screen overlays that sit above the home screen. */
export type OverlayKind = 'none' | 'notification' | 'control' | 'appSwitcher';

/** Hidden behaviour of a fake grey-market site. Nothing is fully reliable. */
export type MarketStatus = 'legit' | 'scam' | 'honeypot' | 'closing';

/**
 * Which network layer a site lives on. This is what makes the three browsers
 * different: Chroma only reaches clearnet shops, Sailor reaches their mirrors,
 * and Shade is the only way onto the onion layer.
 */
export type MarketReach = 'clearnet' | 'mirror' | 'onion';

export type CustomerKind = 'regular' | 'difficult' | 'undercover';

/**
 * Which messenger a person actually uses. People have their own channel, so
 * asking someone to switch apps only works if they are willing to.
 */
export type MessageChannel = 'telegraph' | 'phone';

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

/** A meeting spot on the fictional city map (see src/data/places.ts). */
export type PlaceKind = 'home' | 'shop' | 'park' | 'transit' | 'market' | 'port' | 'police';

export interface Place {
  id: string;
  name: string;
  kind: PlaceKind;
  /** Position on the 400x560 city map. */
  x: number;
  y: number;
  /** 0 quiet .. 3 constantly watched. */
  base: number;
  nightlife?: boolean;
  note: string;
}

export interface InventoryItem {
  id: string;
  /** Links a stack to the fictional product catalogue. */
  productId?: string;
  name: string;
  qty: number;
  unitCost: number;
  /** Expected fictional street value per unit, used to price customer offers. */
  marketPrice?: number;
}

/** A fictional product sold by the grey-market sites. */
export interface Product {
  id: string;
  name: string;
  category: string;
  /** What the market charges the player per unit. */
  wholesale: number;
  /** Reference street value used for customer offers and UI hints. */
  street: number;
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
  /** Network layer the site lives on (see {@link MarketReach}). */
  reach: MarketReach;
  /** Multiplier applied to wholesale prices (mirrors charge a fee). */
  priceMod: number;
  /** Heat added every time this site is loaded in a browser. */
  traceHeat: number;
  /** Onion sites that need an invite before Shade can open them. */
  invite?: boolean;
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
  /** The messenger this person uses. */
  channel: MessageChannel;
  /** Second messenger they will agree to move to, if any. */
  altChannel?: MessageChannel;
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
