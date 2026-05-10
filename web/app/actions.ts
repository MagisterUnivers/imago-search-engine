"use server";

import { SearchParams } from "@/types/search-layer";
import { SearchResult } from "@/lib/search";

export async function searchMediaAction(
  params: SearchParams,
): Promise<SearchResult> {
  const url = new URL(
    "/api/search",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  );

  if (params.q) url.searchParams.set("q", params.q); 
  if (params.credit) url.searchParams.set("credit", params.credit);
  if (params.from) url.searchParams.set("from", params.from);
  if (params.to) url.searchParams.set("to", params.to);
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (params.r) url.searchParams.set("r", params.r);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.pageSize)
    url.searchParams.set("pageSize", String(params.pageSize));

  const res = await fetch(url.toString(), {
    // next.js cache: revalidate every 30s — matches the route's s-maxage header
    // but it would better to use cache: "no-store", because we want react to filters, sort, pagination and input
    // custom cache strategy would be ideal with Redis / CDN
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Search API error ${res.status}: ${body?.message ?? res.statusText}`,
    );
  }

  const data = await res.json();

  return {
    items: data.items,
    total: data.pagination.total,
    page: data.pagination.page,
    pageSize: data.pagination.pageSize,
    totalPages: data.pagination.totalPages,
  };
}
