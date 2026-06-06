import { NextResponse } from "next/server";
import {
  INVALID_UNSUBSCRIBE_HTML,
  UNSUBSCRIBE_HTML,
} from "@/lib/email/unsubscribe-page";
import { createCronClient } from "@/lib/supabase/cron";

async function markUnsubscribed(contactId: string): Promise<boolean> {
  const supabase = createCronClient();

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .maybeSingle();

  if (error || !contact) return false;

  const { error: updateError } = await supabase
    .from("contacts")
    .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
    .eq("id", contactId);

  return !updateError;
}

export async function GET(
  request: Request,
  { params }: { params: { contactId: string } }
) {
  const ok = await markUnsubscribed(params.contactId);
  return new NextResponse(ok ? UNSUBSCRIBE_HTML : INVALID_UNSUBSCRIBE_HTML, {
    status: ok ? 200 : 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/** RFC 8058 one-click unsubscribe — email clients POST here automatically. */
export async function POST(
  _request: Request,
  { params }: { params: { contactId: string } }
) {
  await markUnsubscribed(params.contactId);
  return new NextResponse(null, { status: 200 });
}
