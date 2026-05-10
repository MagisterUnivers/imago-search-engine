import { NextResponse } from "next/server";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  // Prevent this endpoint from being embedded in iframes
  "X-Frame-Options": "DENY",
  // Only cache at the CDN edge, not in the browser (results change with filters)
  "Cache-Control": "no-store",
} as const;

export function includeHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}
