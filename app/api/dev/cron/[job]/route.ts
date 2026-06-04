import { NextResponse } from "next/server";
import { env } from "@/env";
import { runScheduleFollowups } from "@/lib/cron/schedule-followups";
import { runSendEmails } from "@/lib/cron/send-emails";

type RouteContext = { params: { job: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  if (env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    if (params.job === "schedule-followups") {
      return NextResponse.json(await runScheduleFollowups());
    }

    if (params.job === "send-emails") {
      return NextResponse.json(await runSendEmails());
    }

    return NextResponse.json({ error: "Unknown job" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cron job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
