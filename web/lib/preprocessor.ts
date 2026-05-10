/**
 * preprocessor.ts
 *
 * Runs ONCE at module initialization (Next.js server startup).
 * Transforms raw JSON items into a normalized, indexed, searchable dataset.
 *
 * Exported singletons are frozen after build — safe to use across requests.
 */

// ─── Raw shape (as-is from JSON) ─────────────────────────────────────────────

export interface RawMediaItem {
  id: number;
  suchtext: string;
  bildnummer: string;
  fotografen: string;
  datum: string; // "DD.MM.YYYY"
  hoehe: string;
  breite: string;
}

// ─── Filter value shapes ──────────────────────────────────────────────────────

export interface FilterOption {
  label: string;
  value: string;
}

// ─── Inverted index ───────────────────────────────────────────────────────────
// Maps a normalized token → Set of item IDs that contain it.
// O(1) lookup instead of O(n) full scan on every request.

export type InvertedIndex = Map<string, Set<number>>;

// ─── Regex patterns ───────────────────────────────────────────────────────────

/**
 * Restriction tokens: all-caps segments joined by "x"
 * Matches: PUBLICATIONxINxGERxSUIxAUTxONLY, NOxMEXxARG, DISTRIBUTIONxEUROPE
 * Assumption: restrictions always follow CAPSxCAPS pattern.
 * Real implementation would validate against a known list from editorial team.
 */
const RESTRICTION_RE = /\b[A-Z]{2,}(?:x[A-Z]{2,})+\b/g;

/**
 * Archive reference codes: "UnitedArchives" followed by digits
 * Assumption: archive refs always start with "UnitedArchives" prefix.
 */
const ARCHIVE_REF_RE = /\bUnitedArchives\w+\b/;

/**
 * Stop words: tokens that add no search value.
 * Kept minimal — over-filtering reduces recall.
 */

import { STOP_WORDS } from "@/constants/stop-words";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts "DD.MM.YYYY" → "YYYY-MM-DD" (ISO 8601).
 * Falls back to "" if the format is unrecognized.
 */
function parseDatum(raw: string): string {
  const parts = raw.split(".");
  if (parts.length !== 3) return "";
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

/**
 * Extracts and normalizes search tokens from suchtext.
 * Removes: restriction tokens, archive refs, punctuation, stop words, short tokens.
 */
function extractTokens(suchtext: string): string[] {
  const cleaned = suchtext
    .replace(RESTRICTION_RE, "") // strip restriction codes
    .replace(ARCHIVE_REF_RE, "") // strip archive refs
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, " ") // keep dots (for "j.morris"), strip rest
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.split(" ").filter((t) => t.length >= 2 && !STOP_WORDS.has(t)); // filter suchtextNorm from stop words
}

/**
 * Extracts restriction codes from suchtext.
 * Returns them uppercased and deduplicated.
 */
function extractRestrictions(suchtext: string): string[] {
  const matches = suchtext.match(RESTRICTION_RE);
  return matches
    ? Array.from(new Set(matches.map((r) => r.toUpperCase())))
    : [];
}

/**
 * Extracts archive reference (e.g. "UnitedArchives00421716").
 * Returns null if not found.
 */
function extractArchiveRef(suchtext: string): string | null {
  const match = suchtext.match(ARCHIVE_REF_RE);
  return match ? match[0] : null;
}

// ─── Core: single-pass processor ─────────────────────────────────────────────

interface PreprocessorResult {
  /** All normalized items — source of truth for search */
  items: ProcessedMediaItem[];

  /** Inverted index: token → Set<item.id> */
  index: InvertedIndex;

  /** Unique credits derived from fotografen — ready for UI select */
  creditOptions: FilterOption[];

  /** Unique restriction codes — ready for UI combobox */
  restrictionOptions: FilterOption[];
}

function buildPreprocessor(raw: RawMediaItem[]): PreprocessorResult {
  const items: ProcessedMediaItem[] = [];
  const index: InvertedIndex = new Map();

  // Collect unique values for filter dropdowns
  const creditsSet = new Set<string>();
  const restrictionsSet = new Set<string>();

  for (const item of raw) {
    // ── 1. Date normalization ──────────────────────────────────────────────
    const datum = parseDatum(item.datum);

    // ── 2. Extract structured fields from suchtext ────────────────────────
    const restrictions = extractRestrictions(item.suchtext);
    const archiveRef = extractArchiveRef(item.suchtext);
    const tokens = extractTokens(item.suchtext);

    // ── 3. Normalize text fields ──────────────────────────────────────────
    const fotografenNorm = item.fotografen.toLowerCase();
    const suchtextNorm = item.suchtext.toLowerCase();

    // ── 4. Aspect ratio ───────────────────────────────────────────────────
    const h = parseInt(item.hoehe, 10);
    const w = parseInt(item.breite, 10);
    const aspectRatio = h > 0 ? parseFloat((w / h).toFixed(2)) : 1;

    // ── 5. Build processed item ───────────────────────────────────────────
    const processed: ProcessedMediaItem = {
      id: item.id,
      bildnummer: item.bildnummer,
      fotografen: item.fotografen,
      fotografenNorm,
      suchtext: item.suchtext,
      suchtextNorm,
      tokens,
      restrictions,
      archiveRef,
      datum,
      datumRaw: item.datum,
      aspectRatio,
    };

    items.push(processed);

    // ── 6. Build inverted index ───────────────────────────────────────────
    // Index every token (suchtext keywords)
    for (const token of tokens) {
      if (!index.has(token)) index.set(token, new Set());
      index.get(token)!.add(item.id);
    }

    // Also index fotografen tokens (for search by photographer name)
    for (const token of fotografenNorm
      .split(/[\s/]+/)
      .filter((t) => t.length >= 2)) {
      if (!index.has(token)) index.set(token, new Set());
      index.get(token)!.add(item.id);
    }

    // Also index bildnummer (exact lookup)
    if (!index.has(item.bildnummer)) index.set(item.bildnummer, new Set());
    index.get(item.bildnummer)!.add(item.id);

    // ── 7. Collect filter values ──────────────────────────────────────────
    creditsSet.add(item.fotografen);
    for (const r of restrictions) restrictionsSet.add(r);
  }

  // ── 8. Build filter options ─────────────────────────────────────────────
  const creditOptions: FilterOption[] = Array.from(creditsSet)
    .sort()
    .map((c) => ({
      label: c.replace(/^IMAGO\s*\/\s*/i, ""), // strip "IMAGO / " prefix for display
      value: c,
    }));

  const restrictionOptions: FilterOption[] = Array.from(restrictionsSet)
    .sort()
    .map((r) => ({
      label: r,
      value: r,
    }));

  return { items, index, creditOptions, restrictionOptions };
}

// ─── Singletons ───────────────────────────────────────────────────────────────
// Evaluated once when the module is first imported (Next.js server startup).
// Subsequent imports get the cached result — no re-processing per request.

import rawData from "@/data/raw-items-db.json"; // your raw JSON file
import { ProcessedMediaItem } from "@/types/search-layer";

const { items, index, creditOptions, restrictionOptions } = buildPreprocessor(
  rawData as RawMediaItem[],
);

/**
 * All processed media items.
 * Use as the source of truth for search, filtering, and sorting.
 */
export const processedItems: readonly ProcessedMediaItem[] =
  Object.freeze(items);

/**
 * Inverted index: normalized token → Set of item IDs.
 * Use for fast keyword lookup in search.ts
 */
export const invertedIndex: InvertedIndex = index;

/**
 * Unique fotografen values — ready to pass as `credits` prop to SearchFilters.
 */
export const filterCreditOptions: readonly FilterOption[] =
  Object.freeze(creditOptions);

/**
 * Unique restriction codes — ready to pass as `restrictions` prop to SearchFilters.
 */
export const filterRestrictionOptions: readonly FilterOption[] =
  Object.freeze(restrictionOptions);
