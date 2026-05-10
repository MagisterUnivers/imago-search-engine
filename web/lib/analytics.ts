/**
 * In-memory analytics store. Lives for the lifetime of the server process.
 * Resets on server restart — acceptable for a demo.
 *
 * For production: flush to a DB (Postgres, Redis, ClickHouse) on a timer
 * or when the buffer hits a threshold.
 */

interface AnalyticsRecord {
  totalSearches: number;
  totalDurationMs: number;
  queryFrequency: Map<string, number>; // normalized query → count
  recentDurations: number[]; // sliding window for avg calculation
}

export interface AnalyticsSummary {
  totalSearches: number;
  avgDurationMs: number;
  topQueries: { query: string; count: number }[];
}

const store: AnalyticsRecord = {
  totalSearches: 0,
  totalDurationMs: 0,
  queryFrequency: new Map(),
  recentDurations: [],
};

import { MAX_RECENT } from "@/constants/analytics";

export function recordSearch({
  query,
  duration,
}: {
  query: string;
  duration: number;
}): void {
  store.totalSearches++;
  store.totalDurationMs += duration;

  if (store.recentDurations.length >= MAX_RECENT) {
    store.recentDurations.shift();
  }
  store.recentDurations.push(duration);

  if (query) {
    const key = query.toLowerCase().trim();
    store.queryFrequency.set(key, (store.queryFrequency.get(key) ?? 0) + 1);
  }
}

export function getAnalytics(): AnalyticsSummary {
  const avgDuration =
    store.recentDurations.length > 0
      ? store.recentDurations.reduce((a, b) => a + b, 0) /
        store.recentDurations.length
      : 0;

  const topQueries = Array.from(store.queryFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  return {
    totalSearches: store.totalSearches,
    avgDurationMs: Math.round(avgDuration),
    topQueries,
  };
}
