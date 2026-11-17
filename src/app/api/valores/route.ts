import { NextRequest, NextResponse } from "next/server";
import { latestValues } from "@/lib/values";
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const result = await latestValues({
    page: Number(search.get("page") || 1),
    take: Number(search.get("take") || 6),
    query: search.get("q") || "",
  });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
