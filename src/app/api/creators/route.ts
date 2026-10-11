import { NextResponse } from "next/server";
import { getCreatorVideos } from "@/lib/creators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const videos = await getCreatorVideos();
  return NextResponse.json(
    { videos },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
