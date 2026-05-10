import { NextResponse } from "next/server";

export function badRequestHandler(field: string, message: string) {
  return NextResponse.json(
    { error: "INVALID_PARAM", field, message },
    { status: 400 },
  );
}
