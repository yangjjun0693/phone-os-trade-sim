export type NewsCategory = '속보' | '사회' | '경제' | '지역';

export interface Article {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string;
  body: string[];
  hoursAgo: number;
  /** Only shown when heat is at least this high. */
  minHeat?: number;
}

/** Articles visible at the current heat, newest first. */
export function getFeed(articles: Article[], heat: number): Article[] {
  return articles
    .filter((article) => heat >= (article.minHeat ?? 0))
    .sort((a, b) => a.hoursAgo - b.hoursAgo);
}

export function hasBreaking(articles: Article[], heat: number): boolean {
  return getFeed(articles, heat).some((article) => article.category === '속보');
}

export function formatAgo(hoursAgo: number): string {
  if (hoursAgo < 1) return '방금 전';
  if (hoursAgo < 24) return `${Math.round(hoursAgo)}시간 전`;
  return `${Math.round(hoursAgo / 24)}일 전`;
}
