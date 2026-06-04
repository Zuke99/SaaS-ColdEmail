import { NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron/auth";
import { runScheduleFollowups } from "@/lib/cron/schedule-followups";

export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runScheduleFollowups();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Schedule job failed";
    console.error("[cron/schedule-followups]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
