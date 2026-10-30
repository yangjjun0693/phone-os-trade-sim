import { describe, expect, it } from 'vitest';
import { apps } from '@/apps/registry';
import { chromeInverted } from './chrome';

describe('chrome ink', () => {
  it('uses light ink over the always-dark app switcher', () => {
    expect(chromeInverted('appSwitcher', null)).toBe(true);
    expect(chromeInverted('appSwitcher', 'settings')).toBe(true);
  });

  it('keeps the theme ink on the home screen and lock screen', () => {
    expect(chromeInverted('none', null)).toBe(false);
  });

  it('flips to light ink inside an app that is dark in every theme', () => {
    expect(chromeInverted('none', 'steak')).toBe(true);
    expect(chromeInverted('none', 'shade')).toBe(true);
  });

  it('keeps the theme ink inside theme-following apps', () => {
    expect(chromeInverted('none', 'settings')).toBe(false);
    expect(chromeInverted('none', 'news')).toBe(false);
  });

  it('lets a pull-down overlay win over the app underneath', () => {
    // The notification/control veil paints the theme's own surface, so white
    // ink would disappear on it in light mode.
    expect(chromeInverted('notification', 'steak')).toBe(false);
    expect(chromeInverted('control', 'shade')).toBe(false);
  });

  it('knows which apps declare a permanently dark surface', () => {
    // casino · dark-net browser · US storefront (navy brand bar in every theme)
    const dark = apps.filter((app) => app.alwaysDark).map((app) => app.id);
    expect(dark.sort()).toEqual(['amason', 'shade', 'steak']);
  });
});
