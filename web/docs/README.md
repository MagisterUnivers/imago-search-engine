# IMAGO Media Search Engine

A lightweight, production-oriented search layer built on top of IMAGO's media content library.
Implements full-text keyword search, multi-dimensional filtering, relevance scoring, and a polished
Next.js UI — all without an external search engine or database.

**Author:** Andrii Shaposhnikov ([@MagisterUnivers](https://github.com/MagisterUnivers))

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Architecture overview, search strategy, scaling plan, trade-offs

---

## Table of Contents

- [High-Level Approach](#high-level-approach)
- [Assumptions](#assumptions)
- [Design Decisions](#design-decisions)
- [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Limitations & What I Would Do Next](#limitations--what-i-would-do-next)

---

## High-Level Approach

The core challenge: IMAGO's media items carry all their meaning inside a single unstructured text
field (`suchtext`). There is no clean taxonomy, no normalised dates, no explicit restriction list.
The solution is a **preprocessing pipeline** that runs once at server startup, transforms the raw
JSON into a structured in-memory dataset, and builds an **inverted index** for O(1) token lookup.

Every incoming search request then works against this pre-built index rather than scanning all items
from scratch. The result is sub-millisecond search on a 20,000-item dataset with no external
dependencies.

UI is optimised for tablet and desktop viewports (768px+). Mobile layout is out of scope for this submission.

```
Raw JSON (static file)
      │
      ▼
preprocessor.ts  ← runs once at module init
      │  normalise dates, extract tokens/restrictions/archive refs, build inverted index
      ▼
In-memory singletons: processedItems[], invertedIndex (Map<token, Set<id>>)
      │
      ▼
GET /api/search   ← validates params, calls search(), records analytics
      │
      ▼
search.ts         ← candidate selection → scoring → filtering → sorting → pagination
      │
      ▼
searchMediaAction  ← Server Action, called by ContentShowdown (Server Component)
      │
      ▼
Next.js UI        ← URL-driven state, Suspense boundaries, skeleton loading
```

---

## Assumptions

| Area                  | Assumption                                                        | Rationale                                                                                                    |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Restrictions          | Tokens matching `/\b[A-Z]{2,}(?:x[A-Z]{2,})+\b/` are restrictions | All observed samples follow this pattern; real implementation would validate against an editorial dictionary |
| Archive refs          | Tokens starting with `UnitedArchives` are internal archive codes  | Pattern is consistent across all sample items; not exposed in search results                                 |
| Date field            | `datum` is the canonical date for filtering/sorting               | `suchtext` contains a second date (event date) which is inconsistent and not parsed                          |
| Search semantics      | Multi-word query uses OR (union) not AND                          | Maximises recall; relevance scoring surfaces the best matches to the top                                     |
| Restriction labels    | Displayed as raw codes (`PUBLICATIONxINxGERxSUIxAUTxONLY`)        | Source data has no label mapping; a production system would maintain an editorial dictionary                 |
| Dataset size          | 20,000 items fits comfortably in Node.js process memory           | ~5–10 MB RAM for the processed dataset; acceptable for a demo                                                |
| Analytics persistence | In-memory only, resets on restart                                 | Acceptable for a demo; production would persist to a database                                                |

---

## Design Decisions

### Search & Relevance

**Tokenisation** happens identically at index time and query time:

1. Strip restriction codes and archive refs (they are noise for keyword search)
2. Lowercase
3. Remove punctuation except dots (preserves `j.morris` style names)
4. Split on whitespace
5. Remove stop words and tokens shorter than 2 characters

**Inverted index** maps every token to the set of item IDs containing it.
Three fields are indexed: `suchtext` tokens, `fotografen` tokens, and `bildnummer` (exact).

**Scoring weights** (defined in `constants/search-scores.ts`):

| Match type              | Score | Rationale                               |
| ----------------------- | ----- | --------------------------------------- |
| `bildnummer` exact      | 100   | User typed an ID — near-certain intent  |
| `fotografen` token      | 8     | Photographer search is high-specificity |
| `suchtext` token exact  | 4     | Standard keyword match                  |
| `suchtext` token prefix | 2     | Partial match — weaker signal           |

**Multi-token queries** use UNION (OR semantics). `"manchester jackson"` returns items matching
either word. Items matching both tokens score higher and naturally rank first. This approach was
chosen over AND (intersection) because tokens can be distributed across different fields.

**Prefix matching** enables partial queries (`"manch"` → `"manchester"`). Implemented as a linear
scan of index keys, which is acceptable at this scale. At millions of items, a trie or trigram
index would be the replacement.

### URL as State

All filter/sort/pagination state lives in the URL query string. Benefits:

- Shareable search links
- No client-side state management for results
- Browser back/forward works naturally
- Server Components receive parameters directly via `searchParams`

`SearchFilters` is the only Client Component — it writes to the URL via `router.replace()` with
`{ scroll: false }`. The 2-second debounce on the text input prevents excessive navigations while
typing; all other controls trigger immediately.

### Server Components + Suspense

`ContentShowdown` is an async Server Component that fetches and renders results server-side.
Wrapped in `<Suspense>` with a skeleton fallback, it gives instant perceived performance while
the search request resolves. No client-side data fetching, no `useEffect`.

### Security

The `GET /api/search` endpoint applies:

- Input length limits (query ≤ 200 chars)
- Control character stripping
- ISO date format validation with logical range check
- Page/pageSize bounds validation
- `no-store` cache headers (search results must never be cached)
- `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`

Invalid filter values (unknown credit, unknown restriction) return empty results rather than 400 —
they are not errors, just non-matching filters.

---

## Running Locally

### Prerequisites

- Node.js 18+
- npm

### Quick start

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd IMAGO-search/web

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# .env only requires:
# NEXT_PUBLIC_APP_URL=http://localhost:3000

# 4. Start the development server
npm run dev
```

Visit **http://localhost:3000**

### With Docker

```bash
cd IMAGO-search
docker compose up --build
```

Visit **http://localhost:3000**

### Environment variables

| Variable              | Default                 | Description                                              |
| --------------------- | ----------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Base URL used by the Server Action to call the API route |

---

## Project Structure

```
web/
├── app/
│   ├── (root)/                      Landing page
│   ├── (app)/
│   │   ├── (search-engine-flow)/
│   │   │   └── search/
│   │   │       ├── page.tsx         Search page — reads searchParams, renders wrapper
│   │   │       └── error.tsx        Error boundary for failed fetches
│   │   ├── (analytics)/
│   │   │   └── analytics/page.tsx   Analytics dashboard
│   │   └── api/search/route.tsx     GET /api/search endpoint
│   └── actions.ts                   searchMediaAction — Server Action
│
├── lib/
│   ├── preprocessor.ts              Single-pass normaliser + inverted index builder
│   ├── search.ts                    Core search logic (pure functions)
│   └── analytics.ts                 In-memory analytics store
│
├── components/
│   ├── Filters/SearchFilters.tsx    Client Component — all filter/sort controls
│   ├── Showdowns/ContentShowdown.tsx  Async Server Component — renders results
│   ├── Showdowns/AnalyticsShowdown.tsx
│   ├── Cards/ContentCard.tsx
│   └── Paginations/ContentShowdownPagination.tsx
│
├── views/
│   └── SearchShowdownWrapper.tsx    Server Component — composes filters + results
│
├── constants/
│   ├── search-scores.ts             Relevance scoring weights
│   ├── search-constants.ts          MAX_QUERY_LENGTH, DEFAULT_PAGE_SIZE, etc.
│   └── analytics.ts                 MAX_RECENT sliding window size
│
├── types/
│   └── search-layer.ts              ProcessedMediaItem, SearchParams, SortOrder
│
├── data/
│   └── raw-items-db.json            Source dataset (20,000 items)
│
├── handlers/
│   └── bad-request-handler.ts       Reusable 400 response helper
│
└── helpers/
    └── include-headers.ts           Security header injector
```

---

## API Reference

### `GET /api/search`

Search and filter media items.

**Query parameters:**

| Parameter  | Type                      | Default | Description                                   |
| ---------- | ------------------------- | ------- | --------------------------------------------- |
| `q`        | string                    | —       | Free-text search (max 200 chars)              |
| `credit`   | string                    | —       | Exact `fotografen` match                      |
| `from`     | string (ISO date)         | —       | Lower bound for `datum` (`YYYY-MM-DD`)        |
| `to`       | string (ISO date)         | —       | Upper bound for `datum` (`YYYY-MM-DD`)        |
| `r`        | string                    | —       | Comma-separated restriction codes (AND match) |
| `sort`     | `asc` \| `desc` \| `none` | `none`  | Sort by `datum`                               |
| `page`     | number                    | `1`     | Page number (1-based)                         |
| `pageSize` | number                    | `20`    | Items per page (max 100)                      |

**Response (200):**

```json
{
  "items": [
    /* ProcessedMediaItem[] */
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 143,
    "totalPages": 8
  },
  "meta": {
    "query": "manchester",
    "durationMs": 4
  }
}
```

**Error responses:**

| Status | Code             | Condition                                             |
| ------ | ---------------- | ----------------------------------------------------- |
| 400    | `INVALID_PARAM`  | Invalid date format, sort value, or pagination bounds |
| 500    | `INTERNAL_ERROR` | Unexpected error in search logic                      |

---

## Limitations & What I Would Do Next

### Current limitations

- **In-memory only:** the dataset and index are lost on server restart. Any deployment with
  multiple instances would have inconsistent state.
- **No real-time ingestion:** new items require a server restart to be indexed.
- **Prefix scan is O(index size):** acceptable at 20k items, becomes a bottleneck at millions.
- **Restriction labels are raw codes:** no human-readable mapping exists without an editorial dictionary.
- **Analytics are process-scoped:** metrics reset on restart, not shared across instances.
- **Test coverage:** endpoint tested with basic edge cases and validation tests.

### What I would do next

**Short term (polish)**

- Add Jest unit tests for `preprocessor.ts` and `search.ts` (pure functions, trivially testable)
- Add a `snippet` field to results — a highlighted excerpt of `suchtext` showing where the match occurred
- Restriction label dictionary sourced from the editorial team

**Medium term (production-readiness)**

- Replace in-memory store with **PostgreSQL + `pg_trgm`** for full-text search
  and persistent analytics
- Move analytics to **ClickHouse** or **TimescaleDB** for time-series queries
- Add **Redis** caching layer for frequent queries

**Long term (scale)**

- Migrate search to **Elasticsearch** or **Typesense** for million-item scale
- Build a **continuous ingestion pipeline** (see [ARCHITECTURE.md](./ARCHITECTURE.md) for details)
- Add AI-assisted metadata enrichment (see [ARCHITECTURE.md](./ARCHITECTURE.md) for details)

---

_Last updated: May 2026_
