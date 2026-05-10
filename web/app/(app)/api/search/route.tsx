/**
 * Query params:
 *   q          string    free-text search
 *   credit     string    exact fotografen value
 *   from       string    ISO date lower bound  "YYYY-MM-DD"
 *   to         string    ISO date upper bound  "YYYY-MM-DD"
 *   r          string    comma-separated restriction codes
 *   sort       "asc" | "desc" | "none"
 *   page       number    default 1
 *   pageSize   number    default 20, max 100
 */

import { type NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/search";
import { recordSearch } from "@/lib/analytics";
import { badRequestHandler } from "@/handlers/bad-request-handler";

// ─── Validation helpers ───────────────────────────────────────────────────────

import {
  DEFAULT_PAGE_SIZE,
  ISO_DATE_RE,
  MAX_PAGE_SIZE,
  MAX_QUERY_LENGTH,
  SORT_VALUES,
} from "@/constants/route-constants";

// ─── Security headers (applied to every response) ────────────────────────────

import { includeHeaders } from "@/helpers/include-headers";

// ─── Rate limiting note ───────────────────────────────────────────────────────
// For a production endpoint, we would need a rate limiting solution.
// Recommended: Upstash Ratelimit + Redis (works in Next.js edge/serverless).
// For the demo, we rely on Next.js's built-in request coalescing.

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const start = performance.now();
  const sp = request.nextUrl.searchParams;

  // ── 1. Parse + validate params ─────────────────────────────────────────────

  // q — free text
  const rawQuery = sp.get("q") ?? "";
  if (rawQuery.length > MAX_QUERY_LENGTH) {
    return includeHeaders(
      badRequestHandler(
        "q",
        `Query must be ${MAX_QUERY_LENGTH} characters or fewer`,
      ),
    );
  }
  // Sanitize: strip control characters
  const query = rawQuery.replace(/[\x00-\x1F\x7F]/g, "").trim();

  // credit — must be a non-empty string if present; no further validation
  // (invalid values simply match nothing — not an error worth rejecting)
  const credit = sp.get("credit")?.trim() ?? "";

  // from / to — must be valid ISO dates if present
  const dateFrom = sp.get("from")?.trim() ?? "";
  const dateTo = sp.get("to")?.trim() ?? "";

  if (dateFrom && !ISO_DATE_RE.test(dateFrom)) {
    return includeHeaders(
      badRequestHandler("from", "Must be ISO date: YYYY-MM-DD"),
    );
  }
  if (dateTo && !ISO_DATE_RE.test(dateTo)) {
    return includeHeaders(
      badRequestHandler("to", "Must be ISO date: YYYY-MM-DD"),
    );
  }
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return includeHeaders(
      badRequestHandler("from", "'from' must be before 'to'"),
    );
  }

  // r — comma-separated restriction codes
  // Trim each, drop empties; allow unknown values (they just won't match)
  const restrictions = (sp.get("r") ?? "")
    .split(",")
    .map((r) => r.trim().toUpperCase())
    .filter(Boolean);

  // sort
  const rawSort = sp.get("sort") ?? "none";
  if (!SORT_VALUES.has(rawSort)) {
    return includeHeaders(
      badRequestHandler("sort", "Must be one of: asc, desc, none"),
    );
  }
  const sortOrder = rawSort as "asc" | "desc" | "none";

  // page
  const rawPage = sp.get("page") ?? "1";
  const page = parseInt(rawPage, 10);
  if (isNaN(page) || page < 1) {
    return includeHeaders(
      badRequestHandler("page", "Must be a positive integer"),
    );
  }

  // pageSize
  const rawPageSize = sp.get("pageSize") ?? String(DEFAULT_PAGE_SIZE);
  const pageSize = parseInt(rawPageSize, 10);
  if (isNaN(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    return includeHeaders(
      badRequestHandler("pageSize", `Must be between 1 and ${MAX_PAGE_SIZE}`),
    );
  }

  // ── 2. Business logic ──────────────────────────────────────────────────────
  // All validation passed — now we can afford to run the search

  let result;
  try {
    result = search({
      query,
      credit,
      dateFrom,
      dateTo,
      restrictions,
      sortOrder,
      page,
      pageSize,
    });
  } catch (err) {
    // Unexpected error in search logic — log server-side, return generic 500
    console.error("[/api/search] search() threw:", err);
    return includeHeaders(
      NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 }),
    );
  }

  // ── 3. Analytics (non-blocking fire-and-forget) ────────────────────────────
  const duration = performance.now() - start;
  recordSearch({ query, duration }); // never awaited — does not block response

  // ── 4. Response ────────────────────────────────────────────────────────────
  return includeHeaders(
    NextResponse.json({
      items: result.items,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
      meta: {
        query,
        durationMs: Math.round(duration),
      },
    }),
  );
}
