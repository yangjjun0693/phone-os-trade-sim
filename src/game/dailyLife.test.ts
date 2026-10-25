import { describe, expect, it } from 'vitest';
import { ARTICLES } from '@/data/news';
import { PARCELS } from '@/data/parcels';
import { PLACES } from '@/data/places';
import { LARGE_DEPOSIT, assessDeposit, validateAmount, type BankTransaction } from './bank';
import { formatAgo, getFeed, hasBreaking } from './news';
import { parcelProgress } from './parcels';
import { isNightHour, patrolLevel } from './patrol';

const NOW = '2026-03-14T21:47:00.000Z';

const deposit = (hoursAgo: number): BankTransaction => ({
  id: `d-${hoursAgo}`,
  kind: 'deposit',
  amount: 100,
  memo: '현금 입금',
  at: new Date(new Date(NOW).getTime() - hoursAgo * 3_600_000).toISOString(),
});

describe('bank', () => {
  it('validates amounts', () => {
    expect(validateAmount(0, 100)).not.toBeNull();
    expect(validateAmount(1.5, 100)).not.toBeNull();
    expect(validateAmount(500, 100)).not.toBeNull();
    expect(validateAmount(50, 100)).toBeNull();
  });

  it('does not flag a small first deposit', () => {
    expect(assessDeposit(200, [], NOW).flagged).toBe(false);
  });

  it('flags a large deposit', () => {
    const result = assessDeposit(LARGE_DEPOSIT, [], NOW);
    expect(result.flagged).toBe(true);
    expect(result.heatDelta).toBeGreaterThan(0);
  });

  it('flags repeated deposits inside the window but not old ones', () => {
    expect(assessDeposit(100, [deposit(2), deposit(5)], NOW).flagged).toBe(true);
    expect(assessDeposit(100, [deposit(30), deposit(40)], NOW).flagged).toBe(false);
  });
});

describe('patrol', () => {
  it('rises with heat', () => {
    const calm = patrolLevel(1, 0, 12);
    const hot = patrolLevel(1, 90, 12);
    expect(['low', 'mid', 'high'].indexOf(hot)).toBeGreaterThan(['low', 'mid', 'high'].indexOf(calm));
  });

  it('knows night hours and nightlife spots stay busy', () => {
    expect(isNightHour(23)).toBe(true);
    expect(isNightHour(12)).toBe(false);
    expect(patrolLevel(1.7, 20, 1, true)).not.toBe('low');
  });

  it('every place has a valid level at any hour', () => {
    for (const place of PLACES) {
      for (const hour of [0, 6, 12, 18, 23]) {
        expect(['low', 'mid', 'high']).toContain(patrolLevel(place.base, 50, hour, place.nightlife));
      }
    }
  });
});

describe('parcels', () => {
  it('seed parcels land in the expected states at the game epoch', () => {
    const state = (id: string) => parcelProgress(PARCELS.find((p) => p.id === id)!, NOW).state;
    expect(state('p-1')).toBe('delivered');
    expect(state('p-2')).toBe('moving');
    expect(state('p-3')).toBe('delayed');
    expect(state('p-4')).toBe('held');
  });

  it('a delayed parcel eventually moves on', () => {
    const later = new Date(new Date(NOW).getTime() + 48 * 3_600_000).toISOString();
    expect(parcelProgress(PARCELS.find((p) => p.id === 'p-3')!, later).state).not.toBe('delayed');
  });

  it('a held parcel never moves past the hold stage', () => {
    const later = new Date(new Date(NOW).getTime() + 500 * 3_600_000).toISOString();
    const progress = parcelProgress(PARCELS.find((p) => p.id === 'p-4')!, later);
    expect(progress.state).toBe('held');
    expect(progress.stageIndex).toBe(2);
  });
});

describe('news', () => {
  it('shows more at higher heat and sorts newest first', () => {
    const calm = getFeed(ARTICLES, 0);
    const hot = getFeed(ARTICLES, 90);
    expect(hot.length).toBeGreaterThan(calm.length);
    expect(hot[0].hoursAgo).toBeLessThanOrEqual(hot[hot.length - 1].hoursAgo);
  });

  it('breaking news only appears once heat is up', () => {
    expect(hasBreaking(ARTICLES, 0)).toBe(false);
    expect(hasBreaking(ARTICLES, 60)).toBe(true);
  });

  it('formats relative times', () => {
    expect(formatAgo(0.2)).toBe('방금 전');
    expect(formatAgo(5)).toBe('5시간 전');
    expect(formatAgo(48)).toBe('2일 전');
  });
});
