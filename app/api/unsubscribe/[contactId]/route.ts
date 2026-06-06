import { NextResponse } from "next/server";
import {
  INVALID_UNSUBSCRIBE_HTML,
  UNSUBSCRIBE_HTML,
} from "@/lib/email/unsubscribe-page";
import { createCronClient } from "@/lib/supabase/cron";

export async function GET(
  request: Request,
  { params }: { params: { contactId: string } }
) {
  const { contactId } = params;
  console.log("Unsubscribe hit:", contactId, "url:", request.url);

  const supabase = createCronClient();

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .maybeSingle();

  if (error) {
    console.log("Unsubscribe query error:", error.message, "contactId:", contactId);
  }

  if (error || !contact) {
    console.log("Unsubscribe contact not found:", contactId);
    return new NextResponse(INVALID_UNSUBSCRIBE_HTML, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("contacts")
    .update({ status: "unsubscribed", updated_at: now })
    .eq("id", contactId);

  if (updateError) {
    console.log("Unsubscribe update error:", updateError.message);
  } else {
    console.log("Unsubscribe success for contactId:", contactId);
  }

  return new NextResponse(UNSUBSCRIBE_HTML, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
