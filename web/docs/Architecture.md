# IMAGO Search — Architecture & Design Decisions

> Referenced from [README.md](./README.md). This document covers the technical depth behind
> the system: how it is structured, why decisions were made, and where it goes next.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Search Strategy & Relevance](#search-strategy--relevance)
- [Preprocessing Pipeline](#preprocessing-pipeline)
- [Current Limitations](#current-limitations)
- [Scaling to Millions of Items](#scaling-to-millions-of-items)
- [Continuous Ingestion](#continuous-ingestion)
- [Trade-offs](#trade-offs)

---

## System Architecture

The application is a self-contained Next.js 14 monolith. No external search engine, no database —
the entire search stack runs in-process on the Node.js server.

```
data/raw-items-db.json  (static source, ~20k items)
        │
        ▼  lib/preprocessor.ts — runs ONCE at module init
        │  • datum: "DD.MM.YYYY" → "YYYY-MM-DD"
        │  • suchtext → token array (stopwords removed)
        │  • suchtext → restriction codes (regex)
        │  • suchtext → archive ref (regex)
        │  • fotografen → lowercase copy
        │  • build InvertedIndex: Map<token, Set<id>>
        │  • collect unique credits + restrictions for filter UI
        ▼
In-memory singletons (frozen, shared across all requests)
  processedItems[]   — normalised items
  invertedIndex      — Map<token, Set<id>>
  filterCreditOptions[]
  filterRestrictionOptions[]
        │
        ▼  app/api/search/route.ts — GET /api/search
        │  • validate & sanitise all query params
        │  • call lib/search.ts (pure, stateless)
        │  • fire-and-forget analytics recording
        │  • return JSON with items + pagination + meta
        ▼
  lib/search.ts
    1. tokenise query (same logic as preprocessor)
    2. getCandidateIds() — inverted index lookup (O(1) exact + O(n) prefix scan)
    3. scoreItem()       — weighted relevance score per candidate
    4. applyFilters()    — credit / date range / restrictions (AND)
    5. sort             — by score DESC or datum ASC/DESC
    6. paginate         — slice to page/pageSize
        │
        ▼  app/actions.ts — Server Action
        │  • builds URL with query params
        │  • fetch() with cache: "no-store"
        │  • maps response → SearchResult
        ▼
React Server Components
  SearchShowdownWrapper  — server, composes filters + Suspense
  ContentShowdown        — async server, renders grid + pagination
  SearchFilters          — client, writes URL params via router.replace()
```

### Why Server Components + URL state?

All filter/sort/pagination state lives in the URL (`?q=...&credit=...&sort=desc&page=2`).

- Links are shareable
- Browser history works correctly
- Server Components receive `searchParams` directly — no `useEffect`, no client fetch
- `<Suspense>` wrapping `ContentShowdown` gives a skeleton fallback while the search resolves

`SearchFilters` is the only Client Component — a minimal interactive island. It calls
`router.replace()` with `{ scroll: false }` on every filter change, triggering a Next.js soft
navigation that re-renders only the RSC payload.

---

## Search Strategy & Relevance

### Tokenisation

Runs identically at index time (preprocessor) and query time (search). Consistency is critical —
a mismatch would cause indexed tokens to silently not match query tokens.

```
input: "J.Morris, Manchester Utd PUBLICATIONxINxGER UnitedArchives00421716"

1. strip restriction codes  → "J.Morris, Manchester Utd  "
2. strip archive refs       → "J.Morris, Manchester Utd"
3. lowercase                → "j.morris, manchester utd"
4. remove punctuation*      → "j.morris  manchester utd"   * dots kept
5. split on whitespace      → ["j.morris", "manchester", "utd"]
6. remove stopwords + len<2 → ["j.morris", "manchester", "utd"]
```

### Inverted Index

Maps every normalised token → the set of item IDs containing it.

```
"manchester"  → { 1, 14, 203 }
"teutopress"  → { 2, 45, 67 }
"0059987730"  → { 1 }           ← bildnummer indexed for exact ID lookup
```

Three fields are indexed per item: `suchtext` tokens, `fotografen` name parts, `bildnummer`.

### Query Semantics — UNION (OR)

`"manchester jackson"` returns items matching **either** word. UNION was chosen over AND because
tokens can come from different fields — one token in `fotografen`, another in `suchtext` — which
AND semantics would miss. Scoring separates strong matches from weak ones.

### Relevance Scoring

Scores are additive across all query tokens:

| Match type              | Score | Rationale                               |
| ----------------------- | ----- | --------------------------------------- |
| `bildnummer` exact      | 100   | Near-certain intent — user typed an ID  |
| `fotografen` token      | 8     | Photographer search is high-specificity |
| `suchtext` token exact  | 4     | Standard keyword match                  |
| `suchtext` token prefix | 2     | Partial match — weaker signal           |

Items scoring 0 are excluded. In filter-only mode (no query), all items score 1 and sort order
applies directly.

### Filter Pipeline

Applied after scoring, all conditions are AND:

- **credit** — case-insensitive exact match on `fotografen`
- **dateFrom / dateTo** — ISO string comparison (`YYYY-MM-DD` sorts lexicographically)
- **restrictions** — item must contain ALL selected codes

---

## Preprocessing Pipeline

```
RawMediaItem (as-is from JSON)
        │
        ├─ parseDatum()           "01.11.1995" → "1995-11-01"
        ├─ extractTokens()        free-text keywords for indexing
        ├─ extractRestrictions()  /\b[A-Z]{2,}(?:x[A-Z]{2,})+\b/g
        ├─ extractArchiveRef()    /\bUnitedArchives\w+\b/
        ├─ fotografenNorm         .toLowerCase()
        ├─ suchtextNorm           .toLowerCase()
        └─ aspectRatio            parseInt(breite) / parseInt(hoehe)
        │
        ▼
ProcessedMediaItem  (typed, normalised, ready for search)
```

**When it runs:** once, at Node.js module load. The result is `Object.freeze()`-d and shared
across all requests. No per-request preprocessing cost.

**Incremental updates** (new items arriving): the preprocessor functions are stateless and can
be called for a single item, then the result appended to the in-memory arrays and index. No full
rebuild required.

---

## Current Limitations

| Limitation                       | Impact                                            | Notes                                           |
| -------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| In-memory only                   | Resets on restart; not shareable across instances | Acceptable for a demo                           |
| No real-time ingestion           | New items require server restart                  | Documented; pipeline described below            |
| Prefix scan is O(index size)     | Acceptable at 20k; bottleneck at millions         | Replace with trie at scale                      |
| Restriction labels are raw codes | Poor UX for non-technical users                   | Needs editorial dictionary                      |
| Analytics are process-scoped     | Not shared across instances; reset on restart     | Needs persistent store                          |
| No highlighting                  | Users can't see _why_ a result matched            | `suchtext` snippet logic straightforward to add |

---

## Scaling to Millions of Items

### Technology path by scale

| Scale     | Search store              | Notes                                        |
| --------- | ------------------------- | -------------------------------------------- |
| 0 – 100k  | In-memory (current)       | ~50–100 MB RAM                               |
| 100k – 1M | PostgreSQL + `pg_trgm`    | Full-text search, persistent, single-node    |
| 1M – 100M | Elasticsearch / Typesense | Distributed inverted index, relevance tuning |
| 100M+     | Elasticsearch + sharding  | Horizontal scale, replica routing            |

### Replacing the prefix scan

At scale the linear prefix scan (`O(unique tokens)`) becomes a bottleneck. Replacements:

- **Trie** — exact prefix lookup in `O(prefix length)`
- **Trigram index** — PostgreSQL `pg_trgm` provides this natively
- **Edge n-gram tokeniser** — Elasticsearch builds prefix-ready tokens at index time

---

## Continuous Ingestion

The current system is static — data loaded from a JSON file at startup. A production system
needs to handle ~1 new item per minute without downtime or index rebuilds.

### Proposed pipeline

```
New item arrives (upload / external feed)
        │
        ▼
RAW DATABASE (PostgreSQL)
  Stores items as-is, unprocessed.
  Append-only. Source of truth.
        │
        │  Change Data Capture (Debezium) or message queue (Kafka / BullMQ)
        ▼
WORKER POOL
  • Runs same preprocessing logic as current preprocessor.ts
  • Optional: AI enrichment pass (entity extraction, label generation)
  • Writes processed item to PROD store
  • Updates search index incrementally
        │
        ▼
PROD DATABASE / SEARCH ENGINE
  Elasticsearch / Typesense
  Items immediately queryable after worker completes (~seconds latency)
        │
        ▼
Search API  ←  queries prod store, never raw store
```

This mirrors how platforms like YouTube handle uploads: raw video → transcode workers → CDN.
The raw store is never exposed to users. The prod store is always in a consistent, queryable state.

### AI-assisted enrichment (optional worker stage)

The regex-based extraction has known gaps: restrictions in non-standard formats, person names
in other scripts, ambiguous locations. A lightweight LLM pass (e.g. `claude-haiku-4-5` for cost
efficiency) in the worker could:

- Extract structured entities (persons, locations, events) from `suchtext`
- Generate human-readable restriction labels
- Detect language and apply the appropriate tokeniser
- Suggest editorial category tags

Because this runs asynchronously it does not block ingestion or affect query latency.

### Keeping query latency low during high ingestion

- **Redis** — cache top-N frequent queries (TTL 30s); invalidate on index update
- **Read replicas** — route all search queries to replicas, writes to primary
- **Index aliases** (Elasticsearch) — swap index versions atomically with zero downtime
- **Pre-warming** — on deployment, run top-100 queries before receiving traffic

---

## Trade-offs

| Decision           | Chosen                    | Alternative               | Why                                                           |
| ------------------ | ------------------------- | ------------------------- | ------------------------------------------------------------- |
| Search engine      | Custom in-memory          | Elasticsearch / Typesense | No infra deps for demo; same concepts apply at scale          |
| Query semantics    | UNION (OR) + scoring      | INTERSECTION (AND)        | Higher recall; scoring surfaces best matches                  |
| Prefix matching    | Linear key scan           | Trie / trigram index      | Simple; fast enough at 20k items                              |
| Date in suchtext   | Not parsed                | Parse "7th January 1948"  | `datum` is canonical; text date is redundant and inconsistent |
| Restriction labels | Raw codes                 | Human-readable dictionary | No source of truth; documented as known gap                   |
| Analytics          | In-memory                 | PostgreSQL / ClickHouse   | Acceptable for demo; production path described above          |
| Action → API route | `fetch()` to own endpoint | Call `search()` directly  | Demonstrates API contract; enables future service separation  |
| shadcn/ui          | Copied into project       | MUI / Mantine             | Tailwind-native; components are owned and modifiable          |

---

_Last updated: May 2026 · Andrii Shaposhnikov_
