import { describe, it, expect } from 'vitest';
import {
  computeTotalExposure,
  getExposureTier,
  getExposureTierColor,
  switchIdentity,
  logoutIdentity,
  getAppIdentity,
  getSupportedIdentities,
  getIdentityLabel,
  getIdentityDescription,
  createDefaultIdentityState,
  type IdentityKind,
  type AppIdentityMap,
} from './exposure';

const GAME_TIME = '2026-03-14T21:47:00.000Z';

describe('exposure.ts', () => {
  describe('createDefaultIdentityState', () => {
    it('returns default alias state', () => {
      const state = createDefaultIdentityState();
      expect(state.active).toBe('alias');
      expect(state.loggedIn).toBe(false);
      expect(state.lastSwitchedAt).toBeNull();
    });
  });

  describe('getSupportedIdentities', () => {
    it('returns realname only for messages app', () => {
      expect(getSupportedIdentities('messages')).toEqual(['realname']);
    });

    it('returns realname only for gmall', () => {
      expect(getSupportedIdentities('gmall')).toEqual(['realname']);
    });

    it('returns alias only for shade', () => {
      expect(getSupportedIdentities('shade')).toEqual(['alias']);
    });

    it('returns alias only for protean', () => {
      expect(getSupportedIdentities('protean')).toEqual(['alias']);
    });

    it('returns alias only for telegraph', () => {
      expect(getSupportedIdentities('telegraph')).toEqual(['alias']);
    });

    it('returns both for flexible apps', () => {
      expect(getSupportedIdentities('chroma')).toEqual(['realname', 'alias']);
      expect(getSupportedIdentities('trade')).toEqual(['realname', 'alias']);
      expect(getSupportedIdentities('wallet')).toEqual(['realname', 'alias']);
    });
  });

  describe('getIdentityLabel', () => {
    it('returns correct labels', () => {
      expect(getIdentityLabel('realname')).toBe('실명');
      expect(getIdentityLabel('alias')).toBe('별명');
    });
  });

  describe('getIdentityDescription', () => {
    it('returns correct descriptions', () => {
      expect(getIdentityDescription('realname')).toContain('실제 신원');
      expect(getIdentityDescription('alias')).toContain('가명 신원');
    });
  });

  describe('switchIdentity', () => {
    it('creates new identity state for app', () => {
      const identities: AppIdentityMap = {};
      const result = switchIdentity(identities, 'chroma', 'realname', GAME_TIME);

      expect(result.chroma.active).toBe('realname');
      expect(result.chroma.loggedIn).toBe(true);
      expect(result.chroma.lastSwitchedAt).toBe(GAME_TIME);
    });

    it('updates existing identity', () => {
      const identities: AppIdentityMap = {
        chroma: { active: 'alias', loggedIn: true, lastSwitchedAt: GAME_TIME },
      };
      const result = switchIdentity(identities, 'chroma', 'realname', GAME_TIME);

      expect(result.chroma.active).toBe('realname');
      expect(result.chroma.lastSwitchedAt).toBe(GAME_TIME);
    });

    it('returns same object if no change', () => {
      const identities: AppIdentityMap = {
        chroma: { active: 'realname', loggedIn: true, lastSwitchedAt: GAME_TIME },
      };
      const result = switchIdentity(identities, 'chroma', 'realname', GAME_TIME);
      expect(result).toBe(identities);
    });

    it('does not mutate original', () => {
      const identities: AppIdentityMap = {
        chroma: { active: 'alias', loggedIn: true, lastSwitchedAt: GAME_TIME },
      };
      switchIdentity(identities, 'chroma', 'realname', GAME_TIME);
      expect(identities.chroma.active).toBe('alias');
    });
  });

  describe('logoutIdentity', () => {
    it('removes identity for app', () => {
      const identities: AppIdentityMap = {
        chroma: { active: 'alias', loggedIn: true, lastSwitchedAt: GAME_TIME },
        sailor: { active: 'realname', loggedIn: true, lastSwitchedAt: GAME_TIME },
      };
      const result = logoutIdentity(identities, 'chroma');

      expect(result.chroma).toBeUndefined();
      expect(result.sailor).toBeDefined();
    });

    it('returns same object if app not found', () => {
      const identities: AppIdentityMap = {};
      const result = logoutIdentity(identities, 'chroma');
      expect(result).toBe(identities);
    });
  });

  describe('getAppIdentity', () => {
    it('returns stored identity', () => {
      const identities: AppIdentityMap = {
        chroma: { active: 'realname', loggedIn: true, lastSwitchedAt: GAME_TIME },
      };
      const state = getAppIdentity(identities, 'chroma');
      expect(state.active).toBe('realname');
    });

    it('returns default for unknown app', () => {
      const state = getAppIdentity({}, 'unknown');
      expect(state.active).toBe('alias');
      expect(state.loggedIn).toBe(false);
    });
  });

  describe('computeTotalExposure', () => {
    it('returns 0 for empty identities', () => {
      expect(computeTotalExposure({})).toBe(0);
    });

    it('returns 0 for apps not logged in', () => {
      const identities: AppIdentityMap = {
        chroma: { active: 'alias', loggedIn: false, lastSwitchedAt: null },
      };
      expect(computeTotalExposure(identities)).toBe(0);
    });

    it('computes exposure for single app with alias', () => {
      const identities: AppIdentityMap = {
        chroma: { active: 'alias', loggedIn: true, lastSwitchedAt: GAME_TIME },
      };
      // chroma alias: 20 + alias base 5 = 25
      expect(computeTotalExposure(identities)).toBe(25);
    });

    it('computes exposure for single app with realname', () => {
      const identities: AppIdentityMap = {
        chroma: { active: 'realname', loggedIn: true, lastSwitchedAt: GAME_TIME },
      };
      // chroma realname: 35 + realname base 15 = 50
      expect(computeTotalExposure(identities)).toBe(50);
    });

    it('sums exposure across multiple apps', () => {
      const identities: AppIdentityMap = {
        chroma: { active: 'alias', loggedIn: true, lastSwitchedAt: GAME_TIME }, // 25
        shade: { active: 'alias', loggedIn: true, lastSwitchedAt: GAME_TIME },  // 5 + 5 = 10
        trade: { active: 'realname', loggedIn: true, lastSwitchedAt: GAME_TIME }, // 30 + 15 = 45
      };
      // 25 + 10 + 45 = 80
      expect(computeTotalExposure(identities)).toBe(80);
    });

    it('ignores apps without weights', () => {
      const identities: AppIdentityMap = {
        unknownapp: { active: 'realname', loggedIn: true, lastSwitchedAt: GAME_TIME },
        chroma: { active: 'alias', loggedIn: true, lastSwitchedAt: GAME_TIME },
      };
      // Only chroma counts: 25
      expect(computeTotalExposure(identities)).toBe(25);
    });
  });

  describe('getExposureTier', () => {
    it('returns correct tiers', () => {
      expect(getExposureTier(0)).toBe('low');
      expect(getExposureTier(30)).toBe('low');
      expect(getExposureTier(31)).toBe('medium');
      expect(getExposureTier(60)).toBe('medium');
      expect(getExposureTier(61)).toBe('high');
      expect(getExposureTier(100)).toBe('high');
      expect(getExposureTier(101)).toBe('critical');
      expect(getExposureTier(200)).toBe('critical');
    });
  });

  describe('getExposureTierColor', () => {
    it('returns correct color classes', () => {
      expect(getExposureTierColor('low')).toBe('text-ios-green');
      expect(getExposureTierColor('medium')).toBe('text-ios-yellow');
      expect(getExposureTierColor('high')).toBe('text-ios-orange');
      expect(getExposureTierColor('critical')).toBe('text-ios-red');
    });
  });
});