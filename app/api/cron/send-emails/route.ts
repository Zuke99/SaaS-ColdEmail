import { NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron/auth";
import { runSendEmails } from "@/lib/cron/send-emails";

export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runSendEmails();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send job failed";
    console.error("[cron/send-emails]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
