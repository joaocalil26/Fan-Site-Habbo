import { NextRequest, NextResponse } from "next/server";
import { latestFurniture } from "@/lib/external-furniture";
export async function GET(request: NextRequest) {
  const result = await latestFurniture({
    take: Number(request.nextUrl.searchParams.get("take") || 6),
    query: request.nextUrl.searchParams.get("q") || "",
  });
  return NextResponse.json(result, {
    headers: {
      "Cache-Control":
        result.source === "habboassets"
          ? "public, s-maxage=300, stale-while-revalidate=600"
          : "no-store",
    },
  });
}
