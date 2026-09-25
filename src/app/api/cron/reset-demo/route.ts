import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedDatabase } from "@/lib/demo-seed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function cronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const received = Buffer.from(header);
  const wanted = Buffer.from(expected);
  if (received.length !== wanted.length) return false;
  return timingSafeEqual(received, wanted);
}

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedDatabase(prisma, { resetDemo: true });
    return NextResponse.json({
      ok: true,
      demoUserId: result.demoUserId,
      exercises: result.exerciseCount,
      routines: result.routineCount,
      workouts: result.workoutCount,
    });
  } catch (error) {
    console.error("Demo reset failed", error);
    return NextResponse.json({ error: "Demo reset failed" }, { status: 500 });
  }
}
