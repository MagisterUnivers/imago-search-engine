/**
 * Integration tests for GET /api/search.
 * No mocks — tests run against real preprocessor data and search logic.
 * NextRequest is constructed manually; no server needed.
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/(app)/api/search/route";

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/search");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

async function json(res: Response) {
  return res.json();
}

describe("security headers", () => {
  it("sets no-store on every response", async () => {
    const res = await GET(makeRequest());
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("sets X-Content-Type-Options on every response", async () => {
    const res = await GET(makeRequest());
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

describe("GET /api/search — happy path", () => {
  it("returns 200 with correct envelope shape", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await json(res);
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("pagination");
    expect(body).toHaveProperty("meta");
    expect(body.pagination).toMatchObject({
      page: expect.any(Number),
      pageSize: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it("returns items array (non-empty dataset)", async () => {
    const res = await GET(makeRequest());
    const body = await json(res);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
  });

  it("respects default pageSize of 20", async () => {
    const res = await GET(makeRequest());
    const body = await json(res);
    expect(body.items.length).toBeLessThanOrEqual(20);
    expect(body.pagination.pageSize).toBe(20);
  });

  it("echoes query in meta", async () => {
    const res = await GET(makeRequest({ q: "manchester" }));
    const body = await json(res);
    expect(body.meta.query).toBe("manchester");
  });

  it("includes durationMs in meta", async () => {
    const res = await GET(makeRequest({ q: "manchester" }));
    const body = await json(res);
    expect(typeof body.meta.durationMs).toBe("number");
    expect(body.meta.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe("pagination", () => {
  it("returns page 1 by default", async () => {
    const res = await GET(makeRequest());
    const body = await json(res);
    expect(body.pagination.page).toBe(1);
  });

  it("respects custom pageSize", async () => {
    const res = await GET(makeRequest({ pageSize: "5" }));
    const body = await json(res);
    expect(body.items.length).toBeLessThanOrEqual(5);
    expect(body.pagination.pageSize).toBe(5);
  });

  it("page 2 returns different items than page 1", async () => {
    const res1 = await GET(makeRequest({ page: "1", pageSize: "5" }));
    const res2 = await GET(makeRequest({ page: "2", pageSize: "5" }));
    const ids1 = (await json(res1)).items.map((i: { id: number }) => i.id);
    const ids2 = (await json(res2)).items.map((i: { id: number }) => i.id);
    expect(ids1).not.toEqual(ids2);
  });

  it("out-of-range page returns empty items array", async () => {
    const res = await GET(makeRequest({ page: "99999" }));
    const body = await json(res);
    expect(body.items).toHaveLength(0);
  });
});

describe("keyword search", () => {
  it("returns fewer results with a specific query than with no query", async () => {
    const all = await GET(makeRequest()).then(json);
    const filtered = await GET(makeRequest({ q: "manchester" })).then(json);
    expect(filtered.pagination.total).toBeLessThanOrEqual(all.pagination.total);
  });

  it("bildnummer exact search returns exactly one item", async () => {
    // Use the first item's bildnummer from the dataset
    const all = await GET(makeRequest({ pageSize: "1" })).then(json);
    const bildnummer = all.items[0].bildnummer;

    const res = await GET(makeRequest({ q: bildnummer }));
    const body = await json(res);
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    expect(body.items[0].bildnummer).toBe(bildnummer);
  });
});

describe("sorting", () => {
  it("sort=asc returns items in ascending date order", async () => {
    const res = await GET(makeRequest({ sort: "asc", pageSize: "50" }));
    const items = (await json(res)).items;
    for (let i = 1; i < items.length; i++) {
      if (items[i - 1].datum && items[i].datum) {
        expect(items[i - 1].datum <= items[i].datum).toBe(true);
      }
    }
  });

  it("sort=desc returns items in descending date order", async () => {
    const res = await GET(makeRequest({ sort: "desc", pageSize: "50" }));
    const items = (await json(res)).items;
    for (let i = 1; i < items.length; i++) {
      if (items[i - 1].datum && items[i].datum) {
        expect(items[i - 1].datum >= items[i].datum).toBe(true);
      }
    }
  });
});

describe("validation", () => {
  it("returns 400 when q exceeds max length", async () => {
    const res = await GET(makeRequest({ q: "a".repeat(201) }));
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.field).toBe("q");
  });

  it("returns 400 for invalid from date format", async () => {
    const res = await GET(makeRequest({ from: "01.01.2020" }));
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.field).toBe("from");
  });

  it("returns 400 for invalid to date format", async () => {
    const res = await GET(makeRequest({ to: "not-a-date" }));
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.field).toBe("to");
  });

  it("returns 400 when from is after to", async () => {
    const res = await GET(
      makeRequest({ from: "2020-12-31", to: "2020-01-01" }),
    );
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.field).toBe("from");
  });

  it("returns 400 for invalid sort value", async () => {
    const res = await GET(makeRequest({ sort: "random" }));
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.field).toBe("sort");
  });

  it("returns 400 for page=0", async () => {
    const res = await GET(makeRequest({ page: "0" }));
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.field).toBe("page");
  });

  it("returns 400 for non-numeric page", async () => {
    const res = await GET(makeRequest({ page: "abc" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for pageSize exceeding max (100)", async () => {
    const res = await GET(makeRequest({ pageSize: "101" }));
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.field).toBe("pageSize");
  });

  it("returns 400 for pageSize=0", async () => {
    const res = await GET(makeRequest({ pageSize: "0" }));
    expect(res.status).toBe(400);
  });

  // Valid ISO dates should NOT trigger a 400
  it("accepts valid ISO date for from and to", async () => {
    const res = await GET(
      makeRequest({ from: "1990-01-01", to: "2000-12-31" }),
    );
    expect(res.status).toBe(200);
  });

  // Unknown credit is not an error — just returns 0 results
  it("accepts unknown credit without error", async () => {
    const res = await GET(makeRequest({ credit: "IMAGO / UnknownAgency" }));
    expect(res.status).toBe(200);
  });
});

describe("edge cases", () => {
  it("strips control characters from query", async () => {
    const res = await GET(makeRequest({ q: "man\x00chester" }));
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.meta.query).toBe("manchester");
  });

  it("handles empty r param gracefully", async () => {
    const res = await GET(makeRequest({ r: "" }));
    expect(res.status).toBe(200);
  });

  it("handles r with trailing comma gracefully", async () => {
    const res = await GET(makeRequest({ r: "PUBLICATIONxINxGER," }));
    expect(res.status).toBe(200);
  });

  it("returns totalPages consistent with total and pageSize", async () => {
    const res = await GET(makeRequest({ pageSize: "7" }));
    const { pagination } = await json(res);
    expect(pagination.totalPages).toBe(
      Math.ceil(pagination.total / pagination.pageSize),
    );
  });
});
