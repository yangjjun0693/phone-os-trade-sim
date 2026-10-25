import { format, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

/** `1240` -> `₩1,240`. The currency glyph is part of the fiction. */
export function formatCash(value: number): string {
  return `₩${Math.round(value).toLocaleString('ko-KR')}`;
}

/** `5000` -> `5,000` — steak chips have no currency glyph. */
export function formatChips(value: number): string {
  return Math.round(value).toLocaleString('ko-KR');
}

/** `1200000` -> `₩120만`, `30000000` -> `₩3,000만`, `120000000` -> `₩1.2억`. */
export function formatCompactCash(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) {
    const eok = value / 100_000_000;
    return `₩${(Math.round(eok * 10) / 10).toLocaleString('ko-KR')}억`;
  }
  if (abs >= 10_000) {
    return `₩${Math.round(value / 10_000).toLocaleString('ko-KR')}만`;
  }
  return formatCash(value);
}

/** Lock-screen / status-bar clock, always HH:mm. */
export function formatClock(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

/** `3월 14일 토요일` */
export function formatFullDate(iso: string): string {
  return format(new Date(iso), 'M월 d일 EEEE', { locale: ko });
}

/** `3월 14일` — used for compact notification stamps. */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return format(date, 'HH:mm');
  return format(date, 'M/d', { locale: ko });
}

export function formatPercent01(value: number): string {
  return `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;
}
