/**
 * Fictional bank rules. All numbers are game values, not real thresholds.
 *
 * The bank is the cash-risk system's face: big or frequent cash deposits make
 * the (made-up) monitoring system look closer at the account and raise heat.
 */

export type BankTxKind = 'deposit' | 'withdraw' | 'payment' | 'transfer';

export interface BankTransaction {
  id: string;
  kind: BankTxKind;
  /** Positive = money in, negative = money out. */
  amount: number;
  memo: string;
  /** Game-time ISO string. */
  at: string;
  flagged?: boolean;
}

import {
  DEPOSIT_HEAT_FREQUENT,
  DEPOSIT_HEAT_LARGE,
  FREQUENT_COUNT,
  FREQUENT_WINDOW_HOURS,
  LARGE_DEPOSIT,
} from '@/content/economy';

export { FREQUENT_COUNT, FREQUENT_WINDOW_HOURS, LARGE_DEPOSIT };

export interface DepositAssessment {
  flagged: boolean;
  heatDelta: number;
  reason: string | null;
}

/** Validates an amount against what is available. Returns an error message or null. */
export function validateAmount(amount: number, available: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return '금액을 입력해 주세요.';
  if (!Number.isInteger(amount)) return '원 단위로 입력해 주세요.';
  if (amount > available) return '보유 금액이 부족합니다.';
  return null;
}

/**
 * Decides whether a cash deposit looks odd to the fictional monitoring system.
 * `recent` is the existing history (the new deposit is not in it yet).
 */
export function assessDeposit(amount: number, recent: BankTransaction[], nowIso: string): DepositAssessment {
  const now = new Date(nowIso).getTime();
  const windowMs = FREQUENT_WINDOW_HOURS * 60 * 60 * 1000;
  const recentDeposits = recent.filter(
    (tx) => tx.kind === 'deposit' && now - new Date(tx.at).getTime() <= windowMs,
  ).length;

  let heatDelta = 0;
  const reasons: string[] = [];
  if (amount >= LARGE_DEPOSIT) {
    heatDelta += DEPOSIT_HEAT_LARGE;
    reasons.push('고액 현금 입금');
  }
  if (recentDeposits + 1 >= FREQUENT_COUNT) {
    heatDelta += DEPOSIT_HEAT_FREQUENT;
    reasons.push('단기간 반복 입금');
  }

  return {
    flagged: heatDelta > 0,
    heatDelta,
    reason: reasons.length ? reasons.join(' · ') : null,
  };
}
