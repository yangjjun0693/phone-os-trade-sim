/**
 * Identity & Exposure System
 *
 * Pure game logic for tracking which identity (realname vs alias) is active
 * in each app, and computing an abstract "exposure" score. This is entirely
 * fictional game mechanics — no real security advice or techniques.
 */

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

/** Default identity state for a new app. */
export function createDefaultIdentityState(): IdentityState {
  return {
    active: 'alias',
    loggedIn: false,
    lastSwitchedAt: null,
  };
}

/**
 * Exposure weights per (app category × identity) combination.
 * Higher = more visible to in-game observers. Purely fictional numbers.
 */
const EXPOSURE_WEIGHTS: Record<string, Record<IdentityKind, number>> = {
  // Browsers
  chroma: { realname: 35, alias: 20 },
  sailor: { realname: 30, alias: 15 },
  shade: { realname: 50, alias: 5 },

  // Mail
  gmall: { realname: 40, alias: 25 },
  protean: { realname: 45, alias: 10 },

  // Messengers
  telegraph: { realname: 55, alias: 15 },
  ex: { realname: 35, alias: 20 },
  messages: { realname: 25, alias: 40 }, // "메시지/통화" is realname-native

  // Other apps
  trade: { realname: 30, alias: 20 },
  wallet: { realname: 40, alias: 15 },
  notes: { realname: 10, alias: 5 },
  settings: { realname: 5, alias: 5 },
  forum: { realname: 20, alias: 30 },
  contacts: { realname: 15, alias: 25 },
};

/**
 * Base exposure per identity (global modifier).
 * Realname identity is inherently more exposed.
 */
const IDENTITY_BASE_EXPOSURE: Record<IdentityKind, number> = {
  realname: 15,
  alias: 5,
};

/**
 * Compute total exposure across all apps.
 * @param identities Map of appId -> IdentityState
 * @returns Total exposure score (0-100, can exceed 100 in extreme cases)
 */
export function computeTotalExposure(identities: AppIdentityMap): number {
  let total = 0;

  for (const [appId, state] of Object.entries(identities)) {
    if (!state.loggedIn) continue;

    const weights = EXPOSURE_WEIGHTS[appId];
    if (!weights) continue;

    const appExposure = weights[state.active] + IDENTITY_BASE_EXPOSURE[state.active];
    total += appExposure;
  }

  // Clamp to 0-200 range for game UI purposes
  return Math.min(200, Math.max(0, Math.round(total)));
}

/**
 * Get exposure tier label for UI display.
 */
export function getExposureTier(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 100) return 'high';
  return 'critical';
}

/**
 * Get exposure tier color for UI.
 */
export function getExposureTierColor(tier: ReturnType<typeof getExposureTier>): string {
  switch (tier) {
    case 'low': return 'text-ios-green';
    case 'medium': return 'text-ios-yellow';
    case 'high': return 'text-ios-orange';
    case 'critical': return 'text-ios-red';
  }
}

/**
 * Switch identity for a specific app.
 * Returns new AppIdentityMap (immutable update pattern).
 */
export function switchIdentity(
  identities: AppIdentityMap,
  appId: string,
  newIdentity: IdentityKind,
  gameDateTime: string
): AppIdentityMap {
  const current = identities[appId] ?? createDefaultIdentityState();

  if (current.active === newIdentity && current.loggedIn) {
    return identities; // No change
  }

  return {
    ...identities,
    [appId]: {
      active: newIdentity,
      loggedIn: true,
      lastSwitchedAt: gameDateTime,
    },
  };
}

/**
 * Log out from an app (clear identity).
 */
export function logoutIdentity(
  identities: AppIdentityMap,
  appId: string
): AppIdentityMap {
  if (!(appId in identities)) {
    return identities; // Return same object if app not found
  }
  const { [appId]: removed, ...rest } = identities;
  return rest;
}

/**
 * Get the current identity for an app (with default).
 */
export function getAppIdentity(
  identities: AppIdentityMap,
  appId: string
): IdentityState {
  return identities[appId] ?? createDefaultIdentityState();
}

/**
 * Check if an app supports identity switching.
 * Some apps are locked to a specific identity.
 */
export function getSupportedIdentities(appId: string): IdentityKind[] {
  // Apps locked to realname
  const realnameOnly = ['messages', 'gmall'] as const;

  // Apps locked to alias
  const aliasOnly = ['shade', 'protean', 'telegraph'] as const;

  if (realnameOnly.includes(appId as any)) return ['realname'];
  if (aliasOnly.includes(appId as any)) return ['alias'];

  return ['realname', 'alias'];
}

/**
 * Get human-readable identity label.
 */
export function getIdentityLabel(kind: IdentityKind): string {
  return kind === 'realname' ? '실명' : '별명';
}

/**
 * Get human-readable identity description.
 */
export function getIdentityDescription(kind: IdentityKind): string {
  return kind === 'realname'
    ? '실제 신원. 은행, 가족, 지인 연락에 쓰임.'
    : '가명 신원. 거래, 익명 활동에 쓰임.';
}