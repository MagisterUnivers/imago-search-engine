/**
 * Core search logic. Stateless pure functions — no I/O, no side effects.
 * Consumes the singletons built by preprocessor.ts.
 *
 * Search strategy:
 *   1. Tokenize the query the same way we tokenized items at build time.
 *   2. Use the inverted index to get candidate item IDs (fast O(1) lookup per token).
 *      Multi-token query → UNION of sets (OR semantics — broader recall).
 *   3. Score each candidate based on WHERE tokens matched and HOW precisely.
 *   4. Apply filters (credit, date range, restrictions) — all are AND conditions.
 *   5. Sort by score DESC (or by datum if requested).
 *   6. Paginate.
 */

import { ProcessedMediaItem } from "@/types/search-layer";
import { processedItems, invertedIndex } from "./preprocessor";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchParams {
  query?: string; // free-text search
  credit?: string; // exact fotografen match
  dateFrom?: string; // ISO "YYYY-MM-DD"
  dateTo?: string; // ISO "YYYY-MM-DD"
  restrictions?: string[]; // item must contain ALL of these
  sortOrder?: "asc" | "desc" | "none";
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  items: ProcessedMediaItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Scoring weights ──────────────────────────────────────────────────────────
//
// Higher weight = more relevant field.
// Rationale:
//   bildnummer  — user typed an exact ID, near-certain intent
//   fotografen  — searching by photographer is high-specificity
//   tokens      — keyword in suchtext is the common case
//   prefix      — partial match is weaker than exact

import { SCORE } from "@/constants/search-scores";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tokenizes a search query the same way we tokenize items.
 * Keeps dots (for "j.morris" style queries), lowercases, splits on whitespace.
 */
function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/**
 * Returns candidate item IDs from the inverted index for a set of query tokens.
 *
 * Strategy — UNION (OR):
 *   "manchester jackson" returns items matching EITHER word.
 *   This maximises recall. Scoring then separates items matching both (higher score)
 *   from items matching only one token (lower score).
 *
 *   Alternative — INTERSECTION (AND) would give higher precision but miss
 *   items where one token is in fotografen and another is in suchtext.
 *   For a media search engine, recall > precision.
 */
function getCandidateIds(queryTokens: string[]): Set<number> | null {
  if (queryTokens.length === 0) return null; // null = "no query, all items"

  const result = new Set<number>();

  for (const token of queryTokens) {
    // Exact index lookup
    const exact = invertedIndex.get(token);
    if (exact) {
      exact.forEach((id) => result.add(id)); // changed
    }

    // Prefix scan — necessary for partial queries like "manch" → "manchester"
    // Acceptable cost: index keys are short tokens, iteration is fast
    // For 10k items this is fine; at millions, switch to a trie or trigram index
    invertedIndex.forEach((ids, indexedToken) => {
      if (indexedToken !== token && indexedToken.startsWith(token)) {
        ids.forEach((id) => result.add(id));
      }
    }); // changed
  }

  return result;
}

/**
 * Scores a single item against the query tokens.
 * Returns 0 if no tokens match (item should be excluded when query is present).
 */
function scoreItem(item: ProcessedMediaItem, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 1; // no query → all items are equal

  let score = 0;

  for (const token of queryTokens) {
    // bildnummer exact
    if (item.bildnummer === token) {
      score += SCORE.BILDNUMMER_EXACT;
      continue;
    }

    // fotografen token exact
    if (item.fotografenNorm.includes(token)) {
      score += SCORE.FOTOGRAFEN_TOKEN;
    }

    // suchtext token exact match
    if (item.tokens.includes(token)) {
      score += SCORE.TOKEN_EXACT;
    } else {
      // suchtext token prefix match
      const hasPrefix = item.tokens.some((t) => t.startsWith(token));
      if (hasPrefix) score += SCORE.TOKEN_PREFIX;
    }
  }

  return score;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

function applyFilters(item: ProcessedMediaItem, params: SearchParams): boolean {
  // Credit — case-insensitive exact match on the full fotografen string
  if (params.credit) {
    if (item.fotografenNorm !== params.credit.toLowerCase()) return false;
  }

  // Date range — ISO string comparison works correctly for "YYYY-MM-DD"
  if (params.dateFrom && item.datum) {
    if (item.datum < params.dateFrom) return false;
  }
  if (params.dateTo && item.datum) {
    if (item.datum > params.dateTo) return false;
  }

  // Restrictions — AND: item must contain EVERY selected restriction
  if (params.restrictions && params.restrictions.length > 0) {
    for (const r of params.restrictions) {
      if (!item.restrictions.includes(r)) return false;
    }
  }

  return true;
}

// ─── Main search function ─────────────────────────────────────────────────────

export function search(params: SearchParams): SearchResult {
  const { query = "", sortOrder = "none", page = 1, pageSize = 20 } = params;

  const queryTokens = tokenizeQuery(query);

  // ── Step 1: candidate selection ────────────────────────────────────────────
  // With a query → use inverted index (fast path)
  // Without a query → all items are candidates (filter-only mode)
  const candidateIds = getCandidateIds(queryTokens);

  let candidates: ProcessedMediaItem[];

  if (candidateIds === null) {
    // No query — start with everything
    candidates = processedItems as ProcessedMediaItem[];
  } else if (candidateIds.size === 0) {
    // Query had tokens but nothing matched
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  } else {
    // Map IDs back to items
    // processedItems is indexed by array position, not by id — build a lookup
    candidates = processedItems.filter((item) =>
      candidateIds.has(item.id),
    ) as ProcessedMediaItem[];
  }

  // ── Step 2: scoring ────────────────────────────────────────────────────────
  // Attach score to each candidate, then drop zero-score items when query exists
  const scored: Array<{ item: ProcessedMediaItem; score: number }> = candidates
    .map((item) => ({ item, score: scoreItem(item, queryTokens) }))
    .filter(({ score }) => score > 0);

  // ── Step 3: filtering ──────────────────────────────────────────────────────
  const filtered = scored.filter(({ item }) => applyFilters(item, params));

  // ── Step 4: sorting ────────────────────────────────────────────────────────
  if (sortOrder === "asc" || sortOrder === "desc") {
    filtered.sort((a, b) => {
      // Items without a parsed date go to the end
      if (!a.item.datum) return 1;
      if (!b.item.datum) return -1;
      const cmp = a.item.datum.localeCompare(b.item.datum);
      return sortOrder === "asc" ? cmp : -cmp;
    });
  } else {
    // Default: sort by relevance score descending
    filtered.sort((a, b) => b.score - a.score);
  }

  // ── Step 5: pagination ─────────────────────────────────────────────────────
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;
  const pageItems = filtered
    .slice(offset, offset + pageSize)
    .map(({ item }) => item);

  return { items: pageItems, total, page, pageSize, totalPages };
}
